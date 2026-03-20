import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Plus, 
    Users, 
    ShieldCheck, 
    Building2, 
    Mail, 
    Phone, 
    ChevronRight,
    ChevronDown,
    Edit2, 
    Trash2, 
    AlertTriangle, 
    CheckCircle2, 
    X,
    Upload,
    FileText,
    Calendar,
    Clock,
    MoreVertical,
    Check,
    Lock,
    ExternalLink
} from 'lucide-react';

interface Document {
    id: string;
    name: string;
    uploadDate: string;
    expiryDate: string;
    status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Missing';
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    type: 'MusB' | 'PI Office';
    email: string;
    phone?: string;
    expertise?: string;
    assignedStudies: string[];
    status: 'Active' | 'Inactive';
    documents: Document[];
    hasPendingActions: boolean;
}

const MOCK_MUSB_COORDINATORS: TeamMember[] = [
    {
        id: 'mc1',
        name: 'Sarah Jenkins',
        role: 'Senior Clinical Coordinator',
        type: 'MusB',
        email: 's.jenkins@musb.org',
        expertise: 'Oncology, Phase I/II',
        assignedStudies: ['HI-202B', 'MS-801'],
        status: 'Active',
        documents: [],
        hasPendingActions: false
    },
    {
        id: 'mc2',
        name: 'Mark Wilson',
        role: 'Clinical Research Coordinator',
        type: 'MusB',
        email: 'm.wilson@musb.org',
        expertise: 'Metabolic Disorders',
        assignedStudies: ['MS-801'],
        status: 'Active',
        documents: [],
        hasPendingActions: false
    },
    {
        id: 'mc3',
        name: 'Elena Rodriguez',
        role: 'Study Lead',
        type: 'MusB',
        email: 'e.rodriguez@musb.org',
        expertise: 'Neurology, Pediatric',
        assignedStudies: ['NR-009'],
        status: 'Active',
        documents: [],
        hasPendingActions: false
    }
];

const MOCK_OFFICE_TEAM: TeamMember[] = [
    {
        id: 'ot1',
        name: 'Dr. David Miller',
        role: 'Sub-Investigator',
        type: 'PI Office',
        email: 'd.miller@miller-clinic.com',
        phone: '+1 (555) 234-9088',
        assignedStudies: ['HI-202B', 'NR-009'],
        status: 'Active',
        hasPendingActions: true,
        documents: [
            { id: 'd1', name: 'CV', uploadDate: '2025-10-12', expiryDate: '2027-10-12', status: 'Valid' },
            { id: 'd2', name: 'Medical License', uploadDate: '2025-10-12', expiryDate: '2026-04-15', status: 'Expiring Soon' },
            { id: 'd3', name: 'GCP Certificate', uploadDate: '2025-11-05', expiryDate: '2028-11-05', status: 'Valid' }
        ]
    },
    {
        id: 'ot2',
        name: 'Rachel Voss',
        role: 'Phlebotomist',
        type: 'PI Office',
        email: 'r.voss@miller-clinic.com',
        phone: '+1 (555) 234-9021',
        assignedStudies: ['HI-202B'],
        status: 'Inactive',
        hasPendingActions: false,
        documents: [
            { id: 'd4', name: 'Training Certificate', uploadDate: '2026-01-20', expiryDate: '2029-01-20', status: 'Valid' },
            { id: 'd5', name: 'OSHA Training', uploadDate: '2026-01-20', expiryDate: '2026-01-20', status: 'Expired' }
        ]
    }
];

const REQUIRED_DOCS_BY_ROLE: Record<string, string[]> = {
    'APRN': ['CV', 'APRN License', 'Malpractice Insurance', 'GCP Certificate', 'HIPAA Agreement', 'Protocol Training'],
    'Phlebotomist': ['CV', 'Training Certificate', 'Venipuncture Competency', 'OSHA Training', 'HIPAA Agreement'],
    'Nurse': ['CV', 'Nursing License', 'GCP Certificate', 'HIPAA Agreement', 'Protocol Training'],
    'Sub-Investigator': ['CV', 'Medical License', 'GCP Certificate', 'Financial Disclosure', 'Protocol Training'],
    'Administrator': ['CV', 'HIPAA Agreement', 'Platform Authorization'],
    'Clinical Coordinator': ['CV', 'GCP Certificate', 'HIPAA Agreement', 'Protocol Training']
};

export default function PITeamModule() {
    const [activeTab, setActiveTab] = useState<'MusB' | 'Office' | 'All'>('MusB');
    const [officeTeam, setOfficeTeam] = useState<TeamMember[]>(MOCK_OFFICE_TEAM);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Assigned' | 'Active'>('All');

    // Filter Logic
    const filteredMusB = useMemo(() => {
        return MOCK_MUSB_COORDINATORS.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.expertise?.toLowerCase().includes(searchQuery.toLowerCase());
            if (filterStatus === 'Active') return matchesSearch && m.status === 'Active';
            if (filterStatus === 'Assigned') return matchesSearch && m.assignedStudies.length > 0;
            return matchesSearch;
        });
    }, [searchQuery, filterStatus]);

    const filteredOffice = useMemo(() => {
        return officeTeam.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, officeTeam]);

    const allTeam = useMemo(() => [...MOCK_MUSB_COORDINATORS, ...officeTeam], [officeTeam]);

    const handleDelete = (id: string) => {
        const member = officeTeam.find(m => m.id === id);
        if (member?.hasPendingActions) {
            alert("Deletion blocked: User has active study actions pending. Please inactivate instead.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this team member? This action cannot be undone.")) {
            setOfficeTeam(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleInactivate = (id: string) => {
        if (window.confirm("Warning: This user will lose access to all assigned studies immediately. Continue?")) {
            setOfficeTeam(prev => prev.map(m => m.id === id ? { ...m, status: 'Inactive' } : m));
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            {/* Top Header */}
            <div className="flex-shrink-0 px-6 py-6 lg:px-10 lg:py-8 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-20">

                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Team Management</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">
                        Manage coordinators and study staff for your studies
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                    <button 
                        onClick={() => { setSelectedMember(null); setIsEditPanelOpen(true); }}
                        className="px-5 lg:px-6 py-3.5 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-indigo-900/40"
                    >
                        + Add Team Member
                    </button>
                    <button className="px-5 lg:px-6 py-3.5 lg:py-4 bg-white/5 border border-white/10 text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all font-black">
                        + Select MusB Coordinators
                    </button>
                </div>

            </div>

            {/* Navigation Tabs & Search bar stack */}
            <div className="px-6 lg:px-10 py-6 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                {/* Mobile Tab Select Dropdown */}
                <div className="lg:hidden w-full relative group">
                    <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as any)}
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-6 py-3.5 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer outline-none transition-all transition-all italic"
                    >
                        <option value="MusB" className="bg-[#0B101B]">MusB Coordinators</option>
                        <option value="Office" className="bg-[#0B101B]">My Office Team</option>
                        <option value="All" className="bg-[#0B101B]">All Team Members</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
                </div>

                {/* Desktop Tab Buttons */}
                <div className="hidden lg:flex bg-white/5 p-1 rounded-2xl border border-white/5">


                    {[
                        { id: 'MusB', label: 'MusB Coordinators' },
                        { id: 'Office', label: 'My Office Team' },
                        { id: 'All', label: 'All Team Members' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 lg:px-6 py-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>


                <div className="flex flex-col sm:flex-row lg:items-center gap-4 lg:gap-6">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search team..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl pl-11 pr-4 py-2.5 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest"
                        />
                    </div>
                    {activeTab === 'MusB' && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest whitespace-nowrap">Filters:</span>
                            {['All', 'Available', 'Assigned', 'Active'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFilterStatus(f as any)}
                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                                        filterStatus === f ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                    {/* Tab 1: MusB Coordinators */}
                    {activeTab === 'MusB' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/10 border-b border-white/5">
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-16">Select</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Expertise</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Studies</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredMusB.map(m => (
                                            <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 accent-indigo-600" />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold italic">
                                                            {m.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-white italic uppercase">{m.name}</p>
                                                            <p className="text-[9px] text-slate-600 font-bold">{m.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase italic">{m.role}</td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest">{m.expertise}</span>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-black text-indigo-400 uppercase italic">
                                                    {m.assignedStudies.join(', ') || 'None'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                        <span className="text-[9px] font-black text-emerald-400 uppercase italic">Active</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                                    <p className="text-[10px] text-indigo-300/60 font-black uppercase tracking-[0.2em]">MusB internal staff identity verified by global research nodes</p>
                                </div>
                                <button className="px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: PI Office Team */}
                    {activeTab === 'Office' && (
                        <div className="grid gap-6">
                            <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/10 border-b border-white/5">
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Studies</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredOffice.map(m => (
                                            <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-[11px] font-black text-white italic uppercase">{m.name}</p>
                                                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5 italic">{m.role}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                                            <Mail className="w-3 h-3" /> {m.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                                            <Phone className="w-3 h-3" /> {m.phone}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-black text-slate-300 uppercase italic">
                                                    <div className="flex flex-wrap gap-2">
                                                        {m.assignedStudies.map(s => (
                                                            <span key={s} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">#{s}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                        m.status === 'Active' 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                            : 'bg-slate-500/10 text-slate-500 border-white/5'
                                                    }`}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setSelectedMember(m); setIsEditPanelOpen(true); }}
                                                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white hover:text-slate-950 transition-all"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleInactivate(m.id)}
                                                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-500/20 hover:text-amber-400 transition-all"
                                                        >
                                                            <Lock className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(m.id)}
                                                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all text-red-500/60"
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
                    )}

                    {/* Tab 3: All Members */}
                    {activeTab === 'All' && (
                        <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/10 border-b border-white/5">
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Affiliation</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Studies</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTeam.map(m => (
                                        <tr key={m.id} className="hover:bg-white/[0.02] border-b border-white/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-[11px] font-black text-white italic uppercase">{m.name}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold italic line-clamp-1">{m.role}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {m.type === 'MusB' ? <Building2 className="w-3.5 h-3.5 text-indigo-400" /> : <Users className="w-3.5 h-3.5 text-slate-500" />}
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${m.type === 'MusB' ? 'text-indigo-400' : 'text-slate-500'}`}>{m.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-slate-400 italic font-mono">{m.assignedStudies.length.toString().padStart(2, '0')} Protocols</span>
                                            </td>
                                            <td className="px-8 py-6">
                                              <div className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-700'}`} />
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4 decoration-slate-800 flex items-center gap-2 ml-auto">
                                                    Review Audit Trail <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right Side Summary Panel */}
                <div className="hidden xl:block w-[350px] bg-white/[0.02] border-l border-white/5 p-10 space-y-12 shrink-0 overflow-y-auto custom-scrollbar">

                   <section>
                       <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3">Operational Stats</h4>
                       <div className="space-y-6">
                           {[
                               { label: 'Total Personnel', val: allTeam.length, icon: Users, color: 'indigo' },
                               { label: 'Active Status', val: allTeam.filter(t => t.status === 'Active').length, icon: CheckCircle2, color: 'emerald' },
                               { label: 'MusB Network', val: MOCK_MUSB_COORDINATORS.length, icon: Building2, color: 'indigo' },
                               { label: 'PI Office Team', val: officeTeam.length, icon: Users, color: 'slate' }
                           ].map((stat, i) => (
                               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
                                   <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400`}>
                                           <stat.icon className="w-4 h-4" />
                                       </div>
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                   </div>
                                   <span className="text-lg font-black font-mono text-white italic">{stat.val.toString().padStart(2, '0')}</span>
                               </div>
                           ))}
                       </div>
                   </section>

                   <section>
                       <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3">Studies Coverage</h4>
                       <div className="space-y-3">
                            {['HI-202B', 'MS-801', 'NR-009'].map(s => (
                                <div key={s} className="flex items-center justify-between group">
                                    <span className="text-[10px] font-black text-slate-500 uppercase italic">#{s} Protocol</span>
                                    <div className="flex -space-x-3">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0B101B] bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white shadow-xl">
                                                PI
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                       </div>
                   </section>

                   <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-4">
                       <div className="flex items-center gap-3">
                           <AlertTriangle className="w-5 h-5 text-amber-500" />
                           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Action Required</p>
                       </div>
                       <p className="text-[11px] text-slate-500 font-bold leading-relaxed italic">
                           {officeTeam.filter(m => m.documents.some(d => d.status === 'Missing' || d.status === 'Expired')).length} team members have missing or expired required clinical documents.
                       </p>
                   </div>
                </div>
            </div>

            {/* Edit / Add Slide-in Panel */}
            <AnimatePresence>
                {isEditPanelOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditPanelOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[800px] bg-[#0B101B] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
                        >
                            <div className="flex-shrink-0 px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {selectedMember ? 'Edit Team Member' : 'Register New Personnel'}
                                    </h3>
                                    <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mt-1">PI Office Environment & Protocol Access</p>
                                </div>
                                <button onClick={() => setIsEditPanelOpen(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                                {/* Basic Info Section */}
                                <section className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2">
                                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic">Identity & Identification</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Full Name</label>
                                        <input type="text" defaultValue={selectedMember?.name} placeholder="e.g. Rachel Voss" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-700 outline-none focus:border-indigo-500/50" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Clinical Email</label>
                                        <input type="email" defaultValue={selectedMember?.email} placeholder="r.voss@miller-clinic.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-700 outline-none focus:border-indigo-500/50" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Role Selection</label>
                                        <select 
                                            defaultValue={selectedMember?.role || 'Clinical Coordinator'} 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-indigo-500/50 appearance-none italic font-black uppercase"
                                            onChange={(e) => setSelectedMember(prev => prev ? {...prev, role: e.target.value} : null)}
                                        >
                                            {Object.keys(REQUIRED_DOCS_BY_ROLE).map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Mobile/Office Phone</label>
                                        <input type="text" defaultValue={selectedMember?.phone} placeholder="+1 (555) 000-0000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-700 outline-none focus:border-indigo-500/50" />
                                    </div>
                                </section>

                                {/* Access Control & Studies */}
                                <section>
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic">Authorization & Scope</h4>
                                    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Assigned Studies (PI's Portfolio Only)</label>
                                            <div className="flex flex-wrap gap-3">
                                                {['HI-202B', 'MS-801', 'NR-009', 'OB-770'].map(s => (
                                                    <button key={s} className="px-5 py-2.5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                                        Protocol #{s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-6 border-t border-white/5">
                                            <div>
                                                <p className="text-[11px] font-black text-white italic uppercase">Permission Level</p>
                                                <p className="text-[9px] text-slate-500 mt-1 italic font-bold">Defines write access to subject medical records</p>
                                            </div>
                                            <div className="flex bg-white/10 p-1 rounded-xl">
                                                {['Full', 'Limited', 'Read-only'].map(p => (
                                                    <button key={p} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:text-white text-slate-500">
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Required Documents Checklist */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Qualification Repository</h4>
                                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                            Role: {selectedMember?.role || 'Clinical Coordinator'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid gap-4">
                                        {(REQUIRED_DOCS_BY_ROLE[selectedMember?.role || 'Clinical Coordinator'] || []).map((docName, idx) => {
                                            const doc = selectedMember?.documents.find(d => d.name === docName);
                                            return (
                                                <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`p-4 rounded-xl ${doc ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/10 text-slate-600 border border-white/5'}`}>
                                                            {doc ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-white italic uppercase tracking-wider">{docName}</p>
                                                            <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                                                                {doc ? `Uploaded: ${doc.uploadDate} • Expires: ${doc.expiryDate}` : 'Required Document Missing'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {doc && (
                                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                                doc.status === 'Valid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                                doc.status === 'Expiring Soon' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                                                'bg-red-500/10 text-red-500 border border-red-500/20'
                                                            }`}>
                                                                {doc.status}
                                                            </span>
                                                        )}
                                                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                            <Upload className="w-4 h-4" /> Upload
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Activation Status Banner */}
                                <section className="pt-10 border-t border-white/5">
                                    {(selectedMember?.documents.some(d => d.status === 'Missing' || d.status === 'Expired')) || !selectedMember ? (
                                        <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                                    <AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-red-100 italic uppercase">Ineligible for Activation</p>
                                                    <p className="text-[10px] text-red-500/60 font-black uppercase tracking-widest mt-1">Personnel credentials must be verified and valid</p>
                                                </div>
                                            </div>
                                            <button className="px-8 py-3 bg-slate-800 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed border border-white/5">
                                                Locked
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                                    <ShieldCheck className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-emerald-100 italic uppercase">Credential Synchronization Complete</p>
                                                    <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest mt-1">This user is ready for protocol deployment</p>
                                                </div>
                                            </div>
                                            <button className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all">
                                                Activate User
                                            </button>
                                        </div>
                                    )}
                                </section>

                                {/* Sticky Bottom Actions */}
                                <div className="pt-10 pb-20 flex items-center justify-between border-t border-white/5 bg-gradient-to-t from-[#0B101B] to-transparent">
                                    <button onClick={() => handleDelete(selectedMember?.id || '')} className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/20 transition-all">
                                        <Trash2 className="w-4 h-4" /> Delete Person
                                    </button>
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsEditPanelOpen(false)} className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white">Cancel</button>
                                        <button className="px-10 py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all italic">Save Progression</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
