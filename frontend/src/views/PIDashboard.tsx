import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clearToken, authFetch } from '../utils/auth';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import SubmitContentForms from '../components/admin/SubmitContentForms';
import ScreenerBuilder from '../components/admin/ScreenerBuilder';
import LaunchStudyForm from '../components/admin/LaunchStudyForm';
import SponsorsManagement from '../components/admin/SponsorsManagement';
import {
    LayoutDashboard,
    Beaker,
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
    Stethoscope,
    UsersRound,
    Clock,
    ArrowUpRight,
    LogOut,
    Globe,
    Rocket,
    Menu
} from 'lucide-react';

type PIModule = 'OVERSIGHT' | 'STUDIES' | 'PARTICIPANTS' | 'MESSAGES' | 'REPORTS' | 'SUBMIT' | 'SCREENER_BUILDER' | 'LAUNCH_STUDY' | 'SPONSORS';

export default function PIDashboard() {
    const [activeModule, setActiveModule] = useState<PIModule>('OVERSIGHT');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
        { id: 'PARTICIPANTS', label: 'Subject Review', icon: UsersRound },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
        { id: 'REPORTS', label: 'Analytics', icon: TrendingUp },
        { id: 'SUBMIT', label: 'Submit Content', icon: Plus },
        { id: 'SCREENER_BUILDER', label: 'Screener Builder', icon: Filter },
        { id: 'SPONSORS', label: 'Manage Sponsors', icon: Globe },
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
            <header className="fixed top-0 left-0 right-0 h-28 z-[60] bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 lg:px-10">
                <div className="flex items-center gap-6 lg:gap-12">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 active:scale-95 transition-all"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <Link to="/" className="flex items-center group">
                        <div className="h-10 px-4 lg:px-5 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <img src="/logo.jpg" alt="MusB Research" className="h-6 w-auto object-contain" />
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                        <Bell className="w-5 h-5 text-slate-300" />
                    </button>
                    <div className="flex items-center gap-4 pl-6 border-l border-white/10 relative" ref={profileRef}>
                        <div className="text-right">
                            <p className="text-xs font-black text-white uppercase italic leading-none">{userName}</p>
                            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Principal Investigator</p>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all active:scale-95"
                        >
                            <img
                                src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`}
                                alt="PI"
                                className="w-full h-full object-cover"
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-28 bottom-0 w-80 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-[56] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <nav className="space-y-1.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'WEBSITE') navigate('/home');
                                else {
                                    setActiveModule(item.id as PIModule);
                                    setIsSidebarOpen(false);
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${activeModule === item.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="w-10 flex items-center justify-center flex-shrink-0">
                                <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="lg:ml-80 pt-36 pb-24 px-4 lg:px-10 overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && <OversightModule studyCount={studies.length} onLaunch={() => setActiveModule('LAUNCH_STUDY')} />}
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
                    {activeModule === 'SCREENER_BUILDER' && <ScreenerBuilder />}
                    {activeModule === 'SPONSORS' && (
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
                {[
                    { label: 'Active Protocols', val: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'indigo' },
                    { label: 'Total Subjects', val: '1,240', icon: UsersRound, color: 'emerald' },
                    { label: 'Critical Alerts', val: '02', icon: Activity, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-6">
                        <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center`}>
                            <stat.icon className={`w-7 h-7 text-${stat.color}-400`} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</h4>
                            <p className="text-5xl font-black text-white italic tracking-tighter mt-2">{stat.val}</p>
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
