import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken, authFetch } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import DashboardModule from '../components/admin/DashboardModule';
import StudiesModule from '../components/admin/StudiesModule';
import LaunchStudyForm from '../components/admin/LaunchStudyForm';
import ParticipantsModule from '../components/admin/ParticipantsModule';
import SchedulingModule from '../components/admin/SchedulingModule';
import InventoryModule from '../components/admin/InventoryModule';
import SafetyModule from '../components/admin/SafetyModule';
import DocumentsModule from '../components/admin/DocumentsModule';
import DataModule from '../components/admin/DataModule';
import ReportsModule from '../components/admin/ReportsModule';
import TeamModule from '../components/admin/TeamModule';
import SettingsModule from '../components/admin/SettingsModule';
import SubmitContentForms from '../components/admin/SubmitContentForms';

import {
    LayoutDashboard,
    Beaker,
    Users,
    Calendar,
    Box,
    Database,
    ShieldAlert,
    FileBarChart,
    Settings,
    FileText,
    UsersRound,
    Search,
    Bell,
    Plus,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    CircleCheck,
    Clock,
    Truck,
    AlertTriangle,
    Globe,
    ChevronDown,
    MoreHorizontal,
    Download,
    Share2,
    Eye,
    Stethoscope,
    TrendingUp,
    MessageSquare,
    Activity,
    X,
    LogOut
} from 'lucide-react';

type AdminModule = 
    | 'DASHBOARD' 
    | 'STUDIES' 
    | 'PARTICIPANTS' 
    | 'SCHEDULING' 
    | 'INVENTORY' 
    | 'SAFETY' 
    | 'DOCUMENTS' 
    | 'DATA' 
    | 'REPORTS' 
    | 'TEAM' 
    | 'SETTINGS'
    | 'SUBMIT';

export default function AdminDashboard() {
    const [activeModule, setActiveModule] = useState<AdminModule>('DASHBOARD');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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

    const handleSignOut = async () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = async () => {
        await clearToken();
        navigate('/');
    };
    const [studies, setStudies] = useState<any[]>([]);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/studies/`);
            if (res.ok) setStudies(await res.json());
        } catch (e) {
            console.error("Admin Data Fetch Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleLaunchStudy = async (id: number) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/studies/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'ACTIVE' })
            });
            if (res.ok) fetchContent();
        } catch (e) {
            alert('Failed to launch study');
        }
    };

    const handleCreateStudy = async (data: any) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const method = selectedStudy ? 'PATCH' : 'POST';
            const url = selectedStudy ? `${apiUrl}/api/studies/${selectedStudy.id}/` : `${apiUrl}/api/studies/`;
            
            const res = await authFetch(url, {
                method: method,
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setSelectedStudy(null);
                fetchContent();
            } else {
                const err = await res.json();
                alert(`Creation failed: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            alert("Creation failed due to network error");
        }
    };

    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'STUDIES', label: 'Studies', icon: Beaker },
        { id: 'PARTICIPANTS', label: 'Participants', icon: Users },
        { id: 'SCHEDULING', label: 'Scheduling', icon: Calendar },
        { id: 'INVENTORY', label: 'Kits & Inventory', icon: Box },
        { id: 'SAFETY', label: 'Safety (AE/SAE)', icon: ShieldAlert },
        { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
        { id: 'DATA', label: 'Data & Exports', icon: Database },
        { id: 'REPORTS', label: 'Reports', icon: FileBarChart },
        { id: 'TEAM', label: 'Team & Roles', icon: UsersRound },
        { id: 'SETTINGS', label: 'Settings', icon: Settings },
        { id: 'SUBMIT', label: 'Submit Content', icon: Plus },
    ];

    const renderHeader = () => {
        const userStr = localStorage.getItem('user');
        let userName = 'Admin';
        let userEmail = '';
        let userPicture = '';
        try {
            if (userStr) {
                const u = JSON.parse(userStr);
                userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'Admin'));
                userPicture = u.picture || u.avatar || u.avatar_url || '';
            }
        } catch (e) { }

        return (
            <header className="fixed top-0 left-0 right-0 h-28 z-50 bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10">
                <div className="flex items-center gap-12">
                    <Link to="/" className="flex items-center group">
                        <div className="h-10 px-5 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <img src="/logo.jpg" alt="MusB Research" className="h-6 w-auto object-contain" />
                        </div>
                    </Link>
                    <div className="relative hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search participants, studies, or shipping ID..."
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-all w-[400px]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">System Online</span>
                    </div>
                    <button className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                        <Bell className="w-5 h-5 text-slate-300" />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B101B]"></span>
                    </button>
                    <div className="flex items-center gap-4 pl-6 border-l border-white/10 relative" ref={profileRef}>
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-white uppercase italic leading-none">{userName}</p>
                            <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest mt-1">
                                Admin Portal
                            </p>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-cyan-500/50 transition-all active:scale-95"
                        >
                            <img
                                src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=06b6d4&color=fff`}
                                alt="Admin"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=06b6d4&color=fff`;
                                }}
                            />
                        </button>

                        {/* Profile Dropdown */}
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
                                        <p className="text-[9px] text-slate-500 truncate">{userEmail}</p>
                                    </div>
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest">
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

    const renderSidebar = () => (
        <aside className="fixed left-0 top-28 bottom-0 w-80 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-40 overflow-y-auto custom-scrollbar">
            <nav className="space-y-1.5">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (item.id === 'WEBSITE') navigate('/home');
                            else setActiveModule(item.id as AdminModule);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${activeModule === item.id
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <div className="w-10 flex items-center justify-center flex-shrink-0">
                            <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400'}`} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                        {activeModule === item.id && (
                            <motion.div layoutId="activeInd" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    );

    return (
        <div className="min-h-screen bg-transparent">
            {renderHeader()}
            {renderSidebar()}
            <main className="ml-80 pt-36 pb-24 px-10">
                <AnimatePresence mode="wait">
                    {activeModule === 'DASHBOARD' && (
                        <DashboardModule key="DASHBOARD" studyCount={studies.length} />
                    )}
                    
                    {activeModule === 'STUDIES' && (
                        <StudiesModule 
                            studies={studies} 
                            onAdd={() => setShowCreateModal(true)} 
                            onEdit={(s) => {
                                setSelectedStudy(s);
                                setShowCreateModal(true);
                            }}
                            onLaunch={handleLaunchStudy} 
                        />
                    )}
                    {activeModule === 'PARTICIPANTS' && <ParticipantsModule />}
                    {activeModule === 'SCHEDULING' && <SchedulingModule />}
                    {activeModule === 'INVENTORY' && <InventoryModule />}
                    {activeModule === 'SAFETY' && <SafetyModule />}
                    {activeModule === 'DOCUMENTS' && <DocumentsModule />}
                    {activeModule === 'DATA' && <DataModule />}
                    {activeModule === 'REPORTS' && <ReportsModule />}
                    {activeModule === 'TEAM' && <TeamModule />}
                    {activeModule === 'SUBMIT' && <SubmitContentForms userRole="COORDINATOR" />}
                    {activeModule === 'SETTINGS' && <SettingsModule />}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
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
