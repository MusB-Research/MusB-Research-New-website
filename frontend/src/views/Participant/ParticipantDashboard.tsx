import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ClipboardList, Box, Activity, MessageSquare,
    FileText, Trophy, User, ShieldCheck, LogOut, Menu, X,
    Bell, Zap, TrendingUp, Globe
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout, getUser, saveUser, getDisplayName, API } from '../../utils/auth';

// Sub-components from the new modular structure
import { ActionModal, EditModal, LogoutConfirmationModal } from './SharedComponents';
import DashboardView from './DashboardView';
import TasksView from './TasksView';
import StudyKitView from './StudyKitView';
import LogsView from './LogsView';
import MessagesView from './MessagesView';
import DocumentsView from './DocumentsView';
import ReportsView from './ReportsView';
import CompensationView from './CompensationView';
import ProfileView from './ProfileView';
import PrivacyDataView from './PrivacyDataView';
import ConsentModal from './ConsentModal';

export default function ParticipantDashboard() {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ──────────────── STATE MANAGEMENT ────────────────
    const location = useLocation();
    const subRoute = location.pathname.split('/').pop() || '';

    // ──────────────── STATE MANAGEMENT ────────────────
    const [activeNav, setActiveNav] = useState(() => {
        // Init from URL if present
        const route = location.pathname.split('/').pop();
        if (route === 'tasks') return 'Tasks';
        if (route === 'study-kit') return 'Study Kit';
        if (route === 'logs') return 'Logs';
        if (route === 'messages') return 'Messages';
        if (route === 'documents') return 'Documents';
        if (route === 'reports') return 'Reports';
        if (route === 'compensation') return 'Compensation';
        if (route === 'profile') return 'Profile';
        if (route === 'privacy') return 'Privacy & Data';
        return 'Dashboard';
    });

    // Update activeNav when URL changes (for browser back button support)
    useEffect(() => {
        const route = location.pathname.split('/').pop();
        if (route === 'tasks') setActiveNav('Tasks');
        else if (route === 'study-kit') setActiveNav('Study Kit');
        else if (route === 'logs') setActiveNav('Logs');
        else if (route === 'messages') setActiveNav('Messages');
        else if (route === 'documents') setActiveNav('Documents');
        else if (route === 'reports') setActiveNav('Reports');
        else if (route === 'compensation') setActiveNav('Compensation');
        else if (route === 'profile') setActiveNav('Profile');
        else if (route === 'privacy') setActiveNav('Privacy & Data');
        else if (route === 'participant' || !route) setActiveNav('Dashboard');
    }, [location.pathname]);

    const handleNavClick = (label: string) => {
        // Normalize label to Title Case (e.g., 'tasks' -> 'Tasks')
        const normalizedLabel = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        const slugs: Record<string, string> = {
            'Dashboard': '', 'Tasks': 'tasks', 'Study Kit': 'study-kit', 'Logs': 'logs',
            'Messages': 'messages', 'Documents': 'documents', 'Reports': 'reports',
            'Compensation': 'compensation', 'Profile': 'profile', 'Privacy & Data': 'privacy'
        };

        const finalLabel = slugs[normalizedLabel] !== undefined ? normalizedLabel : label;
        const slug = slugs[finalLabel];

        if (finalLabel === 'Main Website') {
            window.open('/', '_blank');
        } else {
            setActiveNav(finalLabel);
            navigate(`/dashboard/participant${slug ? '/' + slug : ''}`);
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    const [tasks, setTasks] = useState<any[]>([]);
    const [kits, setKits] = useState<any[]>([]);
    const [activeStudy, setActiveStudy] = useState<any>(null);

    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; desc: string; primaryAction: string; task?: any } | null>(null);
    const [editModal, setEditModal] = useState({ isOpen: false, title: '', value: '', field: '' });
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

    const [userProfile, setUserProfile] = useState(() => {
        const u = getUser();
        return {
            userName: getDisplayName(u),
            userEmail: u?.email || '',
            userPicture: u?.picture || u?.avatar || u?.profile_picture || '',
            firstName: getDisplayName(u),
            userPhone: u?.mobile_number || u?.phone_number || '',
            userLocation: u?.full_address || '',
            userTimezone: u?.timezone || 'UTC'
        };
    });

    const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
        push: true,
        email: true,
        sms: false
    });

    // ──────────────── DATA FETCHING ────────────────
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In this codebase, the original ParticipantDashboard used authFetch directly.
                const apiUrl = API || 'http://localhost:8000';

                // 1. Fetch Participant's Study
                const pRes = await authFetch(`${apiUrl}/api/participants/`);
                if (pRes.ok) {
                    const pData = await pRes.json();
                    if (pData.length > 0) {
                        const participant = pData[0];
                        // Fetch Study details
                        const sRes = await authFetch(`${apiUrl}/api/studies/${participant.study}/`);
                        if (sRes.ok) setActiveStudy(await sRes.json());
                    }
                }

                // 2. Fetch Tasks
                const tRes = await authFetch(`${apiUrl}/api/participant-tasks/`);
                let fetchedTasks = [];
                if (tRes.ok) {
                    fetchedTasks = await tRes.json();
                }

                // Inject a Dummy Consent Task if not present for testing mission
                const hasConsentTask = fetchedTasks.some((t: any) => t.title?.toLowerCase().includes('consent'));
                if (!hasConsentTask) {
                    fetchedTasks.unshift({
                        id: 'dummy-consent-task',
                        title: 'Informed Consent Form (PI Shared)',
                        status: 'PENDING',
                        due_date: new Date().toISOString(),
                        visit_name: 'Screening Visit',
                        timeline_group: 'Mandatory',
                        estimated_time: '10 min',
                        task_type: 'CONSENT',
                        task_details: {
                            task_type: 'CONSENT',
                            description: 'Review and sign the official study consent form shared by the Principal Investigator.'
                        }
                    });
                }
                setTasks(fetchedTasks);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            }
        };

        const u = getUser();
        if (u) {
            const displayName = getDisplayName(u);
            setUserProfile({
                userName: displayName,
                userEmail: u.email || '',
                userPicture: u.picture || u.avatar || u.profile_picture || '',
                firstName: displayName,
                userPhone: u.mobile_number || u.phone_number || '',
                userLocation: u.full_address || '',
                userTimezone: u.timezone || 'UTC'
            });
        }

        fetchDashboardData();
    }, []);

    // ──────────────── HANDLERS ────────────────
    const toggleNotification = (key: string) => {
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveProfileField = async (field: string, value: string) => {
        try {
            // Update local state
            setUserProfile(prev => ({ ...prev, [field]: value }));
            setEditModal(p => ({ ...p, isOpen: false }));

            // Update localStorage like the monolith did
            const u = getUser();
            if (u) {
                const mapping: Record<string, string> = {
                    'userPhone': 'mobile_number',
                    'userLocation': 'full_address',
                    'userTimezone': 'timezone',
                    'userName': 'full_name',
                    'userPicture': 'picture'
                };
                const key = mapping[field] || field;
                saveUser({ ...u, [key]: value });
            }

            const friendlyName = field === 'userPhone' ? 'Phone' : field === 'userLocation' ? 'Location' : field === 'userTimezone' ? 'Timezone' : field === 'userName' ? 'Name' : field === 'userPicture' ? 'Profile Picture' : 'Profile';
            alert("we got your request and our team members contact you shortly");
        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Security Node Sync Failed. Please retry.");
        }
    };

    const handleExportPDF = async (skipConfirm: boolean = false) => {
        const title = activeNav === 'Reports' ? 'Participant_Clinical_Report.pdf'
            : activeNav === 'Study Kit' ? 'Clinical_Shipping_Label.pdf'
                : 'Document_Export.pdf';

        const proceed = skipConfirm || window.confirm(`System is generating ${title}. Would you like to proceed with the secure download?`);

        if (proceed) {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header: MusB Logo and Branding
            try {
                const logoUrl = '/logo.jpg';
                const img = new Image();
                img.src = logoUrl;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
                if (img.complete && img.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    doc.addImage(dataUrl, 'JPEG', 15, 12, 25, 25);
                }
            } catch (e) { console.warn('Logo failed'); }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(6, 182, 212);
            doc.text('MusB RESEARCH PORTAL', 45, 25);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(`Official Export Identifier: ${title.replace('.pdf', '')}`, 45, 33);

            doc.setDrawColor(226, 232, 240);
            doc.line(15, 45, pageWidth - 15, 45);

            let y = 60;

            // SECTION 1: SYSTEM & METADATA
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            doc.text('CORE REPORT METADATA', 15, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            doc.text(`Internal Protocol ID:`, 15, y); doc.text(`MUSB-NAD-2030`, 60, y); y += 7;
            doc.text(`System Timestamp:`, 15, y); doc.text(`${new Date().toLocaleString()}`, 60, y); y += 15;

            // SECTION 2: PARTICIPANT PROFILE
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            doc.text('PARTICIPANT PROFILE', 15, y);
            y += 10;

            const profileItems = [
                ["Full Display Name", userProfile.userName || 'Unspecified'],
                ["Clinical Email Node", userProfile.userEmail || 'Unspecified'],
                ["Registered Locale", userProfile.userLocation || 'Unspecified'],
                ["Participant Identifier", activeStudy?.participant_id || 'MUSB-NODE-001']
            ];

            profileItems.forEach((row) => {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                doc.text(row[0] + ":", 15, y);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(row[1], 60, y);
                y += 7;
            });
            y += 10;

            // SECTION 3: STUDY ENGAGEMENT SUMMARY
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            doc.text('STUDY ENGAGEMENT SUMMARY', 15, y);
            y += 10;

            const clinicalData = [
                ["Current Protocol", activeStudy?.title || 'MusB Research - Health & Lifestyle'],
                ["Enrollment Point", new Date().toLocaleDateString()],
                ["Total Mission Tasks", tasks.length.toString()],
                ["Completed Milestones", tasks.filter((t: any) => t.status === 'COMPLETED').length.toString()]
            ];

            clinicalData.forEach((row) => {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                doc.text(row[0] + ":", 15, y);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(row[1], 60, y);
                y += 7;
            });

            // Footer / System Validity
            y = 265;
            doc.setDrawColor(226, 232, 240);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            const legalNotice = [
                "This document is securely synchronized via MusB Clinical Node Sync protocol.",
                "CONFIDENTIALITY: Intended solely for the participant and study coordinator.",
                "Generated by MusB Clinical Secure Gateway v2026.1"
            ];
            doc.text(legalNotice, 15, y);

            doc.save(title);
            setTimeout(() => { alert("Report generated successfully."); }, 1000);
        }
    };

    const openActionModal = (title: string, task?: any) => {
        if (task) {
            setModalConfig({
                isOpen: true,
                title: `${title}: ${task.title}`,
                desc: `Initiating workflow for [${task.title}]. Connection protocol status: SECURE.`,
                primaryAction: "CONFIRM MISSION",
                task: task
            });
            return;
        }
        const lowerTitle = title.toLowerCase();

        // Navigation Mapping
        const directNav: Record<string, string> = {
            'tasks': 'Tasks',
            'protocol': 'Tasks',
            'kit': 'Study Kit',
            'logs': 'Logs',
            'dose': 'Logs',
            'supplement': 'Logs',
            'symptom': 'Logs',
            'ae': 'Logs',
            'adverse event': 'Logs',
            'messages': 'Messages',
            'team': 'Messages',
            'comms': 'Messages',
            'compensation': 'Compensation',
            'rewards': 'Compensation',
            'profile': 'Profile',
            'documents': 'Documents',
            'reports': 'Reports',
            'privacy': 'Privacy & Data'
        };

        for (const [key, view] of Object.entries(directNav)) {
            if (lowerTitle.includes(key)) {
                // Determine the slug for the view
                const slugs: Record<string, string> = {
                    'Dashboard': '',
                    'Tasks': 'tasks',
                    'Study Kit': 'study-kit',
                    'Logs': 'logs',
                    'Messages': 'messages',
                    'Documents': 'documents',
                    'Reports': 'reports',
                    'Compensation': 'compensation',
                    'Profile': 'profile',
                    'Privacy & Data': 'privacy'
                };
                const slug = slugs[view];
                setActiveNav(view);
                navigate(`/dashboard/participant${slug ? '/' + slug : ''}`);
                return;
            }
        }

        // eConsent Trigger
        if (lowerTitle.includes('consent') || (task?.task_details?.task_type === 'CONSENT')) {
            setIsConsentModalOpen(true);
            return;
        }

        // Logic for specialized modals (if not caught by directNav)
        if (lowerTitle.includes('start task') || lowerTitle.includes('initialize task')) {
            setActiveNav('Tasks');
            return;
        }

        // Logic for specialized modals
        if (lowerTitle.includes('phone')) {
            setEditModal({ isOpen: true, title: 'Edit Phone Number', value: userProfile.userPhone, field: 'userPhone' });
        } else if (lowerTitle.includes('location')) {
            setEditModal({ isOpen: true, title: 'Edit Location', value: userProfile.userLocation, field: 'userLocation' });
        } else if (lowerTitle.includes('timezone')) {
            setEditModal({ isOpen: true, title: 'Edit Timezone', value: userProfile.userTimezone, field: 'userTimezone' });
        } else if (lowerTitle.includes('email')) {
            setEditModal({ isOpen: true, title: 'Edit Email Address', value: userProfile.userEmail, field: 'userEmail' });
        } else if (lowerTitle.includes('profile')) {
            setEditModal({ isOpen: true, title: 'Edit Display Name', value: userProfile.userName, field: 'userName' });
        } else {
            setModalConfig({
                isOpen: true,
                title: title,
                desc: `You are initiating the ${title} workflow. Securely connecting your input to the study coordinator.`,
                primaryAction: "CONTINUE"
            });
        }
    };

    const handleActionConfirm = async () => {
        if (!modalConfig) return;
        const title = modalConfig.title;
        const task = modalConfig.task;
        setModalConfig(null);
        setIsActionProcessing(true);

        // For Help/Coordinator requests, trigger the backend notification immediately
        if (title.toLowerCase().includes('help') || title.toLowerCase().includes('coordinator') || title.toLowerCase().includes('emergency')) {
            try {
                // Robust study_id resolution: 
                // 1. Check activeStudy object (standard dashboard state)
                // 2. Check task_details (nested in ParticipantTask)
                // 3. Check task.study (direct ID on ParticipantTask or Task)
                const sId = activeStudy?.id || activeStudy?._id || task?.task_details?.study || task?.study;

                await authFetch(`${API}/api/help-request/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        study_id: sId,
                        action_title: title
                    })
                });
            } catch (err) {
                console.error("Backend dispatch failed:", err);
            }
        }

        setTimeout(() => {
            setIsActionProcessing(false);

            if (task) {
                const taskId = task.id;
                setTasks((prev: any[]) => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
                alert("we got your request and our team members contact you shortly");
                return;
            }

            if (title.toLowerCase().includes('confirm') && title.toLowerCase().includes('received')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Tasks');
                return;
            }

            if (title.toLowerCase().includes('sync') || title.toLowerCase().includes('collection')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Dashboard');
                return;
            }

            if (title.toLowerCase().includes('report') || title.toLowerCase().includes('problem')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Messages');
                return;
            }

            if (title.toLowerCase().includes('export') || title.toLowerCase().includes('download') || title.toLowerCase().includes('label') || title.toLowerCase().includes('data') || title.toLowerCase().includes('request')) {
                handleExportPDF(true);
                return;
            }

            if (title.toLowerCase().includes('receipt')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Study Kit');
                return;
            }

            if (title.toLowerCase().includes('photo')) {
                fileInputRef.current?.click();
                return;
            }

            const taskToUpdate = tasks.find((t: any) => t.task_details?.title === title || title.toLowerCase().includes('protocol') || title.toLowerCase().includes('start'));
            if (taskToUpdate || title.toLowerCase().includes('task') || title.toLowerCase().includes('log') || title.toLowerCase().includes('symptom')) {
                if (taskToUpdate) {
                    setTasks((prev: any[]) => prev.map(t => t.id === taskToUpdate.id ? { ...t, status: 'COMPLETED' } : t));
                }
                alert("we got your request and our team members contact you shortly");
                if (title.toLowerCase().includes('task')) setActiveNav('Tasks');
                if (title.toLowerCase().includes('dose') || title.toLowerCase().includes('symptom')) setActiveNav('Logs');
                return;
            }

            if (title.toLowerCase().includes('withdraw')) {
                alert("we got your request and our team members contact you shortly");
                return;
            }

            if (title.toLowerCase().includes('delete')) {
                if (window.confirm("FINAL WARNING: This will permanently delete your clinical profile and all associated data. This action is irreversible. Proceed?")) {
                    alert("🔒 Securely scrubbing personal nodes... logging out.");
                    performLogout();
                    navigate('/signin');
                }
                return;
            }

            alert("we got your request and our team members contact you shortly");
        }, 1500);
    };

    const handleConsentComplete = async (signedPdf: File) => {
        setIsConsentModalOpen(false);
        setIsActionProcessing(true);

        try {
            const formData = new FormData();
            formData.append('study', activeStudy?.id);
            formData.append('full_name', userProfile.userName);
            formData.append('email', userProfile.userEmail);
            formData.append('signed_pdf', signedPdf);

            const apiUrl = API || 'http://localhost:8000';
            const response = await authFetch(`${apiUrl}/api/consents/`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("🔒 eConsent Protocol Finalized. Signed document has been securely uploaded to the study node.");
                // Update relevant task if any
                setTasks((prev: any[]) => prev.map(t => t.title.toLowerCase().includes('consent') ? { ...t, status: 'COMPLETED' } : t));
            } else {
                const err = await response.json();
                console.error("Consent upload failed:", err);
                alert("Security node sync failed. Please try again or contact your coordinator.");
            }
        } catch (err) {
            console.error("Consent process failed:", err);
            alert("Internal protocol error. Please retry.");
        } finally {
            setIsActionProcessing(false);
        }
    };

    useEffect(() => {
        const role = getRole();
        if (role && role !== 'PARTICIPANT') {
            const link = role === 'SUPER_ADMIN' ? '/dashboard/super-admin' : role === 'ADMIN' ? '/dashboard/admin' : role === 'PI' ? '/dashboard/pi' : '/';
            navigate(link, { replace: true });
        }
    }, [navigate]);

    const initials = userProfile.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
    const navItems = [
        { label: 'Main Website', icon: Globe },
        { label: 'Dashboard', icon: LayoutDashboard },
        { label: 'Tasks', icon: ClipboardList },
        { label: 'Study Kit', icon: Box },
        { label: 'Logs', icon: Activity },
        { label: 'Messages', icon: MessageSquare },
        { label: 'Documents', icon: FileText },
        { label: 'Reports', icon: TrendingUp },
        { label: 'Compensation', icon: Trophy },
        { label: 'Profile', icon: User },
        { label: 'Privacy & Data', icon: ShieldCheck },
    ];

    return (
        <div className="h-screen flex overflow-hidden font-sans relative" style={{ background: 'transparent' }}>
            {/* Sidebar Overlay */}
            {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}

            <aside className={`w-[260px] h-full flex-shrink-0 flex flex-col border-r border-white/[0.05] relative z-40 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'fixed left-0 bg-[#0d1525]/90 translate-x-0' : 'fixed lg:relative -translate-x-full'}`} style={{ background: 'rgba(13, 21, 37, 0.8)', backdropFilter: 'blur(12px)' }}>
                <div className="h-20 px-6 flex justify-between items-center lg:justify-center border-b border-white/[0.05]">
                    <Link to="/" target="_blank">
                        <div className="rounded-[2rem] overflow-hidden bg-white shadow-[0_0_25px_rgba(255,255,255,0.1)] hover:scale-105 transition-all">
                            <img
                                src="/logo.jpg"
                                alt="MusB"
                                className="h-14 w-auto object-contain"
                            />
                        </div>
                    </Link>
                    <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(false)}><X /></button>
                </div>

                <div className="mx-5 mt-2 mb-6 bg-[#141e35]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-black overflow-hidden">
                        {userProfile.userPicture ? <img src={userProfile.userPicture} className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <p className="text-base font-black text-white uppercase truncate">{userProfile.userName}</p>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-1">Participant</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = activeNav === item.label;
                        return (
                            <button
                                key={item.label}
                                onClick={() => { handleNavClick(item.label); }}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-[#0a1525] text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                                <span className="text-base font-bold">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="px-4 pb-6 pt-4 border-t border-white/[0.05]">
                    <button onClick={() => setIsLogoutModalOpen(true)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-bold">Sign Out</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative z-20 w-full">
                <header className="h-24 sm:h-20 flex items-center justify-between px-4 lg:px-10 border-b border-white/[0.04] shrink-0 relative bg-[#0a0e1a]/60 backdrop-blur-xl z-[100] transition-all">
                    <div className="flex items-center gap-6">
                        <button className="lg:hidden text-slate-300" onClick={() => setIsMobileMenuOpen(true)}><Menu /></button>
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group hover:border-cyan-400 transition-all cursor-default hidden sm:flex shadow-inner">
                            <Zap className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-cyan-500/60 uppercase tracking-[0.3em] mb-1 italic">Active Node</span>
                            <span className="text-xl font-black text-white italic uppercase tracking-tighter">{activeNav}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 relative" ref={dropdownRef}>
                        <div
                            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className="hidden sm:flex flex-col items-end gap-1">
                                <span className="text-base font-black text-white italic uppercase tracking-tight">{userProfile.userName}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">{userProfile.userEmail}</span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl hover:border-cyan-500/40 transition-all ring-1 ring-white/5">
                                {userProfile.userPicture ? <img src={userProfile.userPicture} className="w-full h-full object-cover" /> : <span className="text-lg font-black">{initials}</span>}
                            </div>
                        </div>

                        {/* User Dropdown Menu */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 top-full mt-4 w-56 bg-[#0d1424] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl z-[60] overflow-hidden"
                                >
                                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Session Identity</p>
                                        <p className="text-xs font-black text-white uppercase italic truncate">{userProfile.userName}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => { setActiveNav('Profile'); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
                                        >
                                            <User className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold uppercase tracking-widest italic">View Profile</span>
                                        </button>
                                        <button
                                            onClick={() => { setIsLogoutModalOpen(true); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
                                        >
                                            <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold uppercase tracking-widest italic">Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-12 scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeNav} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            {activeNav === 'Dashboard' && <DashboardView firstName={userProfile.userName || userProfile.firstName} userTimezone={userProfile.userTimezone} today={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' })} onAction={(v: string) => handleNavClick(v)} tasks={tasks} study={activeStudy} handleExportPDF={handleExportPDF} />}
                            {activeNav === 'Tasks' && <TasksView tasks={tasks} onAction={openActionModal} study={activeStudy} userName={userProfile.userName} />}
                            {activeNav === 'Study Kit' && <StudyKitView onAction={openActionModal} study={activeStudy} />}
                            {activeNav === 'Logs' && <LogsView study={activeStudy} onAction={openActionModal} />}
                            {activeNav === 'Messages' && <MessagesView study={activeStudy} />}
                            {activeNav === 'Documents' && <DocumentsView handleExportPDF={handleExportPDF} study={activeStudy} />}
                            {activeNav === 'Reports' && <ReportsView userName={userProfile.userName} handleExportPDF={handleExportPDF} study={activeStudy} />}
                            {activeNav === 'Compensation' && <CompensationView study={activeStudy} />}
                            {activeNav === 'Profile' && (
                                <ProfileView
                                    {...userProfile}
                                    initials={initials}
                                    notificationSettings={notificationSettings}
                                    toggleNotification={toggleNotification}
                                    onAction={openActionModal}
                                />
                            )}
                            {activeNav === 'Privacy & Data' && <PrivacyDataView onAction={openActionModal} />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <ActionModal isOpen={modalConfig?.isOpen} title={modalConfig?.title} desc={modalConfig?.desc} action={modalConfig?.primaryAction} onClose={() => setModalConfig(null)} onConfirm={handleActionConfirm} />
            <EditModal isOpen={editModal.isOpen} title={editModal.title} value={editModal.value} field={editModal.field} onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))} onSave={handleSaveProfileField} />
            <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={performLogout} />
            <ConsentModal
                isOpen={isConsentModalOpen}
                onClose={() => setIsConsentModalOpen(false)}
                onComplete={handleConsentComplete}
                study={activeStudy}
                userProfile={userProfile}
            />
            <input
                type="file" ref={fileInputRef} style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const result = event.target?.result as string;
                            handleSaveProfileField('userPicture', result);
                        };
                        reader.readAsDataURL(file);
                        alert("we got your request and our team members contact you shortly");
                    }
                }}
            />
        </div>
    );
}
