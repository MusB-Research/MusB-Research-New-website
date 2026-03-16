import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clearToken, authFetch } from '../utils/auth';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import SubmitContentForms from '../components/admin/SubmitContentForms';
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
    Globe
} from 'lucide-react';

type PIModule = 'OVERSIGHT' | 'STUDIES' | 'PARTICIPANTS' | 'MESSAGES' | 'REPORTS' | 'SUBMIT';

export default function PIDashboard() {
    const [activeModule, setActiveModule] = useState<PIModule>('OVERSIGHT');
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

    const handleSignOut = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = () => {
        clearToken();
        localStorage.removeItem('user');
        navigate('/');
    };
    const [studies, setStudies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newStudy, setNewStudy] = useState({ title: '', protocol_id: '', study_type: 'RANDOMIZED' });

    const fetchPIContent = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/studies/`);
            if (res.ok) {
                setStudies(await res.json());
            }
        } catch (e) {
            console.error("PI Data Fetch Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPIContent();
    }, []);

    const handleCreateStudy = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/studies/`, {
                method: 'POST',
                body: JSON.stringify(newStudy)
            });
            if (res.ok) {
                setShowCreateModal(false);
                fetchPIContent();
                setNewStudy({ title: '', protocol_id: '', study_type: 'RANDOMIZED' });
            }
        } catch (e) {
            alert("Creation failed");
        }
    };



    const navItems = [
        { id: 'WEBSITE', label: 'Main Website', icon: Globe },
        { id: 'OVERSIGHT', label: 'Scientific Oversight', icon: Activity },
        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
        { id: 'PARTICIPANTS', label: 'Subject Review', icon: UsersRound },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
        { id: 'REPORTS', label: 'Analytics', icon: TrendingUp },
        { id: 'SUBMIT', label: 'Submit Content', icon: Plus },
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
            <header className="fixed top-0 left-0 right-0 h-28 z-50 bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10">
                <div className="flex items-center gap-12">
                    <Link to="/" className="flex items-center group">
                        <div className="h-10 px-5 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
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

            <aside className="fixed left-0 top-28 bottom-0 w-80 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-40">
                <nav className="space-y-1.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'WEBSITE') navigate('/home');
                                else setActiveModule(item.id as PIModule);
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

            <main className="ml-80 pt-36 pb-24 px-10">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && <OversightModule studyCount={studies.length} />}
                    {activeModule === 'STUDIES' && <StudyOverviewModule studies={studies} onAdd={() => setActiveModule('SUBMIT')} />}
                    {activeModule === 'SUBMIT' && <SubmitContentForms userRole="PI" />}
                </AnimatePresence>
            </main>

            {/* Create Study Modal - Reused logic for consistency */}
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
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-[3rem] p-12 overflow-hidden"
                        >
                            <div className="absolute top-8 right-8">
                                <button onClick={() => setShowCreateModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Initialize <span className="text-indigo-400">Research Protocol</span></h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 px-1">Define scientific parameters and investigator oversight</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Protocol Title</label>
                                            <input 
                                                type="text" 
                                                value={newStudy.title}
                                                onChange={(e) => setNewStudy({...newStudy, title: e.target.value})}
                                                placeholder="e.g. Oncology Phase I" 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Protocol Number</label>
                                            <input 
                                                type="text" 
                                                value={newStudy.protocol_id}
                                                onChange={(e) => setNewStudy({...newStudy, protocol_id: e.target.value})}
                                                placeholder="PRT-2024-X1" 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Study Model</label>
                                        <select 
                                            value={newStudy.study_type}
                                            onChange={(e) => setNewStudy({...newStudy, study_type: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500/50 transition-all font-black uppercase tracking-widest text-[9px] appearance-none"
                                        >
                                            <option value="RANDOMIZED">Randomized Controlled Trial (RCT)</option>
                                            <option value="OBSERVATIONAL">Observational Study</option>
                                            <option value="OPEN_LABEL">Open Label</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleCreateStudy}
                                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all mt-4"
                                >
                                    Generate Research Framework
                                </button>
                            </div>
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

function OversightModule({ studyCount }: { studyCount: number }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
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

function StudyOverviewModule({ studies, onAdd }: { studies: any[], onAdd: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Research <span className="text-indigo-400">Portfolio</span></h2>
                <button onClick={onAdd} className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3">
                    <Plus className="w-4 h-4" /> Initialize Protocol
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
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
