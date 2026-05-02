import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Search, Building2, Calendar, Sparkles, Terminal, FileText, Database, Shield, Bold, Italic, Underline, Link, ChevronDown, DraftingCompass, Edit3 } from 'lucide-react';
import ScreenerBuilder from './ScreenerBuilder';
import QuestionnaireBuilder from './QuestionnaireBuilder';
import { motion, AnimatePresence } from 'framer-motion';

import { getCurrencySymbol, formatCurrency } from '../../utils/format';

interface LaunchStudyFormProps {
    onClose?: () => void;
    onSave?: (data: any) => void | boolean | Promise<void | boolean>;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
    availableSponsorUsers?: any[];
}

const getSponsorDisplayName = (sponsorId: string) => {
    // This is a simplified helper; in a real app, you'd lookup in availableSponsors/Users
    // For now, we'll try to guess if it's an ID or a name already saved
    if (!sponsorId) return 'Not selected';
    return sponsorId; 
};

const STEPS = [
    { id: 1, label: 'Protocol' },
    { id: 2, label: 'Study info' },
    { id: 3, label: 'Design' },
    { id: 4, label: 'Team' },
    { id: 5, label: 'Screening' },
    { id: 6, label: 'Questionnaires' },
    { id: 7, label: 'Documents' },
    { id: 8, label: 'Review' },
];

const SponsorSearchModal = ({ isOpen, onClose, onSelect, availableSponsors, availableSponsorUsers, onAddOrg, onInviteDelegate }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [orgs, setOrgs] = useState<any[]>([]);
    const [individuals, setIndividuals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        const headers: any = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        Promise.all([
            availableSponsors && availableSponsors.length > 0
                ? Promise.resolve(availableSponsors)
                : fetch('/api/sponsor-organizations/?limit=100', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? d : (d?.results || [])),
            availableSponsorUsers && availableSponsorUsers.length > 0
                ? Promise.resolve(availableSponsorUsers)
                : fetch('/api/users/?limit=100', { headers }).then(r => r.json()).then(d => (Array.isArray(d) ? d : (d?.results || [])).filter((u: any) => (u.role || '').toString().toUpperCase() === 'SPONSOR'))
        ])
            .then(([orgList, userList]) => { setOrgs(orgList); setIndividuals(userList); })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const q = searchQuery.toLowerCase();
    const filteredOrgs = orgs.filter((s: any) => (s.name || s.organization || '').toLowerCase().includes(q));
    const filteredIndividuals = individuals.filter((u: any) =>
        `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''}`.toLowerCase().includes(q)
    );
    const getInitials = (u: any) => ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || u.email?.[0]?.toUpperCase() || '?';

    return (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black text-white tracking-widest uppercase mb-1">Identity Protocol</div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Sponsor Portal Search</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-white/5 bg-[#0B101B]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search Organizations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 italic font-medium transition-colors"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-5 bg-[#0B101B] space-y-5" style={{ maxHeight: '400px' }}>
                    {isLoading && <div className="text-slate-400 text-center py-10 italic text-sm">Loading sponsors...</div>}
                    {!isLoading && (
                        <>
                            {/* Organizations */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 size={12} className="text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase">Organizations ({filteredOrgs.length})</span>
                                </div>
                                {filteredOrgs.length === 0 && <p className="text-slate-600 italic text-xs px-2">No organizations found.</p>}
                                {filteredOrgs.map((s: any, idx: number) => (
                                    <div key={s.id || idx} onClick={() => onSelect({ ...s, _type: 'org' })} className="group flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-blue-500/30 hover:bg-blue-600/10 transition-all cursor-pointer mb-1">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0"><Building2 size={16} /></div>
                                            <div className="min-w-0">
                                                <div className="text-white font-bold italic truncate text-sm">{s.name || s.organization}</div>
                                                <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-0.5">{s.type || 'Sponsor Org'}{s.email ? ` · ${s.email}` : ''}</div>
                                            </div>
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 px-4 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 font-black text-[10px] tracking-widest uppercase shrink-0">Select</span>
                                    </div>
                                ))}
                            </div>
                            {/* Individual Sponsors */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase">Individual Sponsors ({filteredIndividuals.length})</span>
                                </div>
                                {filteredIndividuals.length === 0 && <p className="text-slate-600 italic text-xs px-2">No individual sponsors found.</p>}
                                {filteredIndividuals.map((u: any, idx: number) => (
                                    <div key={u.id || idx} onClick={() => onSelect({ ...u, _type: 'user', name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email })} className="group flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-emerald-500/30 hover:bg-emerald-600/10 transition-all cursor-pointer mb-1">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">{getInitials(u)}</div>
                                            <div className="min-w-0">
                                                <div className="text-white font-bold italic truncate text-sm">{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</div>
                                                <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-0.5 truncate">{u.email}{u.organization ? ` · ${u.organization}` : ''}</div>
                                            </div>
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 px-4 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 font-black text-[10px] tracking-widest uppercase shrink-0">Select</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0F172A] grid grid-cols-2 gap-4">
                    <button
                        onClick={onAddOrg}
                        className="py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-500 transition-colors text-center shadow-lg shadow-blue-900/20"
                    >
                        Register New Org
                    </button>
                    <button
                        onClick={onInviteDelegate}
                        className="py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-white/5 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors text-center"
                    >
                        Invite Delegate
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddOrganizationModal = ({ isOpen, onClose, onSave }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [type, setType] = useState('SPONSOR');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#060B16]/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Register Organization</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Add a new sponsor entity to the database</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. BioCore Pharmaceuticals" className="w-full bg-[#0B101B] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors italic font-medium" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="sponsor@example.com" className="w-full bg-[#0B101B] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors italic font-medium" />
                    </div>
                </div>
                <div className="p-8 bg-[#0B101B] flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl font-black text-[11px] tracking-widest uppercase text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={() => onSave({ name, email, type })} className="flex-1 py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-500 transition-colors">Create Org</button>
                </div>
            </motion.div>
        </div>
    );
};

const InviteDelegateModal = ({ isOpen, onClose, onInvite }: any) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#060B16]/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Invite Delegate</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Send a portal invitation to a sponsor contact</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} type="text" placeholder="John" className="w-full bg-[#0B101B] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors italic font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                            <input value={lastName} onChange={e => setLastName(e.target.value)} type="text" placeholder="Doe" className="w-full bg-[#0B101B] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors italic font-medium" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="contact@sponsor.com" className="w-full bg-[#0B101B] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors italic font-medium" />
                    </div>
                </div>
                <div className="p-8 bg-[#0B101B] flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl font-black text-[11px] tracking-widest uppercase text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={() => onInvite({ email, first_name: firstName, last_name: lastName })} className="flex-1 py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">Send Invite</button>
                </div>
            </motion.div>
        </div>
    );
};

const BULLET = '• ';

const addBulletsToText = (text: string): string => {
    if (!text) return '';
    return text.split('\n').map(line => {
        const trimmed = line.trimStart();
        if (trimmed === '') return '';
        if (trimmed.startsWith('• ') || trimmed.startsWith('• ')) return line;
        return BULLET + trimmed;
    }).join('\n');
};

const stripBulletsFromText = (text: string): string => {
    return text.split('\n').map(line => line.replace(/^[•\-\*]\s*/, '').trimStart()).join('\n');
};

const ToolbarButton = ({ icon: Icon, onClick, active = false }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${active ? 'text-blue-400 bg-white/5' : 'text-slate-400'}`}
    >
        <Icon size={14} />
    </button>
);

const BulletTextarea = ({ value, onChange, placeholder, rows = 4, name, mode, onModeToggle }: {
    value: string; onChange: (val: string) => void; placeholder?: string; rows?: number; name?: string;
    mode: 'bullet' | 'plain'; onModeToggle: () => void;
}) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    const insertText = (before: string, after: string = '') => {
        const el = ref.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const selected = text.substring(start, end);

        // Toggle logic: If selection is already wrapped, unwrap it
        if (selected.startsWith(before) && selected.endsWith(after) && before !== '') {
            const unwrapped = selected.substring(before.length, selected.length - after.length);
            const newVal = text.substring(0, start) + unwrapped + text.substring(end);
            onChange(newVal);
            setTimeout(() => {
                el.focus();
                el.setSelectionRange(start, start + unwrapped.length);
            }, 0);
            return;
        }

        let actualBefore = before;
        let actualAfter = after;

        // Handle Link specially
        if (before === 'link') {
            const url = window.prompt('Enter URL:', 'https://');
            if (!url) return;
            actualBefore = '[';
            actualAfter = `](${url})`;
        }

        const replacement = actualBefore + selected + actualAfter;
        const newVal = text.substring(0, start) + replacement + text.substring(end);
        onChange(newVal);

        setTimeout(() => {
            el.focus();
            if (selected) {
                // Keep the newly formatted text selected
                el.setSelectionRange(start, start + replacement.length);
            } else {
                // Move cursor between the tags
                const newPos = start + actualBefore.length;
                el.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mode !== 'bullet') return;
        const el = ref.current;
        if (!el) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const current = el.value;
            const before = current.substring(0, start);
            const after = current.substring(end);
            const newVal = before + '\n' + BULLET + after;
            onChange(newVal);
            requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 1 + BULLET.length;
            });
            return;
        }

        if (e.key === 'Backspace') {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            if (start === end) {
                const before = el.value.substring(0, start);
                const lineStart = before.lastIndexOf('\n') + 1;
                const linePrefix = before.substring(lineStart);
                if (linePrefix === BULLET) {
                    e.preventDefault();
                    const newVal = el.value.substring(0, lineStart > 0 ? lineStart - 1 : 0) + el.value.substring(start);
                    onChange(newVal);
                    requestAnimationFrame(() => {
                        el.selectionStart = el.selectionEnd = Math.max(0, lineStart - 1);
                    });
                }
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (mode !== 'bullet') {
            onChange(val);
            return;
        }
        
        const el = ref.current;
        const cursor = el?.selectionStart ?? 0;
        const lines = val.split('\n');
        const fixed = lines.map((line) => {
            if (line === '') return '';
            if (line.startsWith(BULLET)) return line;
            return BULLET + line.replace(/^[•\-\*]\s*/, '');
        });
        const newVal = fixed.join('\n');

        if (newVal !== val) {
            onChange(newVal);
            requestAnimationFrame(() => {
                if (el) el.selectionStart = el.selectionEnd = cursor + (newVal.length - val.length);
            });
        } else {
            onChange(val);
        }
    };

    const handleFocus = () => {
        if (mode !== 'bullet') return;
        const el = ref.current;
        if (!el) return;
        if (!el.value) {
            onChange(BULLET);
            requestAnimationFrame(() => { if (el) el.selectionStart = el.selectionEnd = BULLET.length; });
        }
    };

    const handleBlur = () => {
        if (mode !== 'bullet') return;
        if (value.trim() === BULLET.trim()) onChange('');
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {/* Formatting buttons removed to prevent confusing raw markdown tags in textarea */}
                </div>
                <button
                    type="button"
                    onClick={onModeToggle}
                    className={`text-[10px] px-3 py-1 rounded-full font-bold tracking-wider border transition-all ${
                        mode === 'bullet' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                >
                    {mode === 'bullet' ? 'AUTO-BULLET' : 'PLAIN TEXT'}
                </button>
            </div>
            <textarea
                ref={ref}
                name={name}
                value={value}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y leading-relaxed font-medium"
                style={{ lineHeight: '1.8' }}
            />
        </div>
    );
};

// Manual currency Signs removed in favor of Intl.NumberFormat utility

const LaunchStudyForm: React.FC<LaunchStudyFormProps> = ({
    onClose,
    onSave,
    initialData,
    availablePIs,
    availableCoordinators,
    availableSponsors,
    availableSponsorUsers
}) => {
    const [currentStep, setCurrentStep] = useState(initialData ? 8 : 1);
    const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
    const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
    const [isInviteDelegateModalOpen, setIsInviteDelegateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(!initialData || initialData.status === 'DRAFT');
    const [teamLoading, setTeamLoading] = useState(false);
    const [fetchedPIs, setFetchedPIs] = useState<any[]>([]);
    const [fetchedCoordinators, setFetchedCoordinators] = useState<any[]>([]);
    const [fetchedSponsorUsers, setFetchedSponsorUsers] = useState<any[]>([]);

    const handleCreateOrg = async (orgData: any) => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        try {
            const res = await fetch('/api/sponsor-organizations/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(orgData)
            });
            if (res.ok) {
                const newOrg = await res.json();
                setIsAddOrgModalOpen(false);
                setIsSponsorModalOpen(true); // Re-open parent
                alert(`Organization ${newOrg.name} created!`);
            }
        } catch (e) { alert("Failed to create organization"); }
    };

    const handleInviteDelegate = async (inviteData: any) => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        try {
            const res = await fetch('/api/invitations/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...inviteData, role: 'SPONSOR' })
            });
            if (res.ok) {
                setIsInviteDelegateModalOpen(false);
                setIsSponsorModalOpen(true);
                alert(`Invitation sent to ${inviteData.email}!`);
            }
        } catch (e) { alert("Failed to send invitation"); }
    };

    // Merge prop-based lists with fetched lists (prop takes priority if provided)
    const resolvedPIs = (availablePIs && availablePIs.length > 0) ? availablePIs : fetchedPIs;
    const resolvedCoordinators = (availableCoordinators && availableCoordinators.length > 0) ? availableCoordinators : fetchedCoordinators;
    const resolvedSponsorUsers = (availableSponsorUsers && availableSponsorUsers.length > 0) ? availableSponsorUsers : fetchedSponsorUsers;

    const trialModelToLabel: Record<string, string> = {
        RCT: 'Randomized controlled trial',
        OPEN_LABEL: 'Open label study',
        IHUT: 'In-home use test',
        REGISTRY: 'Patient repository',
        OBSERVATIONAL: 'Observational study',
        BIOEQUIVALENCE: 'Bioequivalence study'
    };
    const phaseToLabel: Record<string, string> = {
        'N/A': 'N/A',
        PHASE_0: 'Phase 0',
        PHASE_1: 'Phase 1',
        PHASE_1_2: 'Phase 1/2',
        PHASE_2: 'Phase 2',
        PHASE_2_3: 'Phase 2/3',
        PHASE_3: 'Phase 3',
        PHASE_4: 'Phase 4',
        PILOT: 'Pilot',
        BIOEQUIVALENCE: 'Bioequivalence'
    };
    const maskingToLabel: Record<string, string> = {
        NONE: 'None (open label)',
        SINGLE_BLIND: 'Single blind',
        DOUBLE_BLIND: 'Double blind',
        TRIPLE_BLIND: 'Triple blind',
        QUADRUPLE_BLIND: 'Quadruple blind'
    };
    const studyTypeToLabel: Record<string, string> = {
        IN_PERSON: 'In-person',
        VIRTUAL: 'Remote',
        DECENTRALIZED: 'Hybrid'
    };
    const rewardTypeToLabel: Record<string, string> = {
        CASH: 'Cash',
        VISA_CARD: 'Gift Card',
        MASTER_CARD: 'Gift Card',
        MIXED: 'Product'
    };
    const rewardLogicToLabel: Record<string, string> = {
        FULL_STUDY: 'Per study completion',
        PER_VISIT: 'Per visit',
        PER_TASK: 'Milestone based'
    };
    const getSponsorDisplayName = (value: string) => {
        if (!value) return '';
        return availableSponsors?.find((s: any) => String(s.id) === String(value))?.name || value;
    };

    // Form State
    const [formData, setFormData] = useState({
        internalId: 'MUSB-2025-001',
        sponsor: '',
        startDate: '',
        endDate: '',
        fullTitle: '',
        shortTitle: '',
        category: '',
        briefSummary: '',
        studyOverview: '',
        benefits: '',
        participationMessage: '',
        primaryModel: '',
        clinicalPhase: 'N/A',
        maskingStrategy: 'None (open label)',
        executionMode: 'In-person',
        rewardType: 'Cash',
        incentiveLogic: 'Per study completion',
        stipendAmount: '',
        currency: 'USD',
        requireStudyKit: false,
        studyKitDetails: '',
        textModes: {
            studyOverview: 'bullet',
            benefits: 'bullet',
            participationMessage: 'bullet'
        },
        targetEnrollment: '',
        consentMethods: {
            eConsent: false,
            paperConsent: false,
            remoteWitness: false,
            lar: false,
            parentGuardian: false
        },
        selectedPIs: [] as string[],
        selectedCoordinators: [] as string[],
        selectedSponsorUsers: [] as string[],
        invitePIEmail: '',
        inviteCoordinatorEmail: '',
        inviteSponsorEmail: '',
        screenerQuestions: [] as any[],
        selectedQuestionnaires: [] as string[],
        consentFormFile: null as File | null,
        extractedConsentText: '',
        additionalDocuments: [] as File[]
    });

    const [isExtracting, setIsExtracting] = useState(false);
    const [showAIImportModal, setShowAIImportModal] = useState(false);
    const [smartImportText, setSmartImportText] = useState('');

    const handleAIExtraction = async (file: File) => {
        setIsExtracting(true);
        // Simulation of AI extraction with a slight delay for realism
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const mockConsentText = `INFORMED CONSENT AND PRIVACY AUTHORIZATION FORM

STUDY IDENTIFIER: ${formData.internalId || 'MUSB-2025-001'}
PROTOCOL TITLE: ${formData.fullTitle || 'Comprehensive Clinical Biomarker and Longitudinal Health Assessment Study'}
INVESTIGATOR: Dr. Sarah MusB, PhD
SPONSOR: ${formData.sponsor || 'MusB Research Institute'}

--------------------------------------------------
1. KEY INFORMATION
--------------------------------------------------
You are being asked to participate in a research study. Your participation is voluntary. This summary provides key information to help you decide whether to take part.
- The purpose of this study is to track long-term clinical biomarkers.
- Participation will last approximately 12 months.
- Major procedures include monthly health screenings and digital diary entries.
- The main risk is potential fatigue during assessments.
- You may benefit from detailed personal health reports.

--------------------------------------------------
2. DETAILED STUDY PURPOSE
--------------------------------------------------
The primary objective of this research is to evaluate the clinical utility of non-invasive monitoring tools in predicting early-stage inflammatory responses. We seek to understand how environmental factors interact with genetic markers over a ${formData.endDate ? 'sustained' : '6-month'} period. This study is funded by the ${formData.sponsor || 'National Research Council'} and managed by MusB Research.

--------------------------------------------------
3. STUDY PROCEDURES AND TIMELINE
--------------------------------------------------
If you enroll, you will undergo the following:

PHASE I: BASELINE (Month 1)
- Initial Physical Assessment: 90 minutes
- Genetic Screening: Single blood draw (10ml)
- Portal Onboarding: Training on the digital health app

PHASE II: MONITORING (Months 2-11)
- Monthly Clinic Visits: Weight, Blood Pressure, and Vitals monitoring
- Weekly Digital Surveys: 10-minute questionnaires via the secure participant portal
- Quarterly Biomarker Tests: Non-invasive imaging at our central facility

PHASE III: CONCLUSION (Month 12)
- Final Health Evaluation: Comprehensive review of all collected data
- Exit Interview: Feedback on study experience

--------------------------------------------------
4. RISKS, DISCOMFORTS, AND SAFETY
--------------------------------------------------
PHYSICAL RISKS:
Minimal. Blood draws may cause minor bruising or lightheadedness. Imaging is non-invasive and does not use ionizing radiation.

PSYCHOLOGICAL RISKS:
Some questionnaires may ask sensitive health questions that could cause mild stress. You may skip any question you do not wish to answer.

DATA RISKS:
While we use high-grade encryption, there is always a minimal risk of unauthorized data access. We mitigate this through strict PII masking.

--------------------------------------------------
5. BENEFITS TO YOU AND OTHERS
--------------------------------------------------
DIRECT BENEFITS:
You will receive complimentary health assessments and copies of your biomarker reports, which you may share with your personal physician.

SOCIETAL BENEFITS:
The data collected will contribute to the global understanding of preventative medicine and may lead to earlier diagnostic tools for millions of patients.

--------------------------------------------------
6. DATA PRIVACY AND CONFIDENTIALITY (HIPAA)
--------------------------------------------------
We will protect your information as required by law. Your identity will be replaced with a unique Research ID. All data is stored on MusB's Tier-4 encrypted clinical servers.
Your protected health information (PHI) will only be shared with:
- The Investigator and authorized research staff
- The Institutional Review Board (IRB) for safety monitoring
- Regulatory agencies (e.g., FDA) if required by law

--------------------------------------------------
7. COMPENSATION AND REWARDS
--------------------------------------------------
For your participation, you will receive compensation as follows:
- Baseline Completion: 50 ${formData.currency || 'USD'}
- Monthly Monitoring: 20 ${formData.currency || 'USD'} per month (Total: 200 ${formData.currency || 'USD'})
- Study Completion Bonus: 100 ${formData.currency || 'USD'}

TOTAL POTENTIAL COMPENSATION: ${formData.stipendAmount || '350'} ${formData.currency || 'USD'}.
Payments will be issued within 48 hours of each milestone via ${formData.rewardType || 'Digital Credit'}.

--------------------------------------------------
8. NEW FINDINGS
--------------------------------------------------
If we learn any new information that might change your mind about staying in the study, we will inform you immediately. You will then have a chance to decide if you want to continue.

--------------------------------------------------
9. VOLUNTARY PARTICIPATION AND WITHDRAWAL
--------------------------------------------------
Your participation is 100% voluntary. You can say 'no' now, or change your mind later. Your decision will not affect your relationship with MusB Research or your healthcare providers. To withdraw, contact the study coordinator or use the 'Withdraw' button in your portal.

--------------------------------------------------
10. CONTACT INFORMATION
--------------------------------------------------
STUDY TEAM:
Investigator: Dr. Sarah MusB
Email: research@musb.ai | Phone: (555) 012-3456

IRB OVERSIGHT:
If you have questions about your rights as a participant, contact the MusB Ethics Committee at:
Email: ethics@musb.ai | Phone: (555) 987-6543

--------------------------------------------------
11. PARTICIPANT ACKNOWLEDGMENT AND SIGNATURES
--------------------------------------------------
By signing this document, I acknowledge that:
- I have read (or have had read to me) the information in this consent form.
- I have had the opportunity to ask questions and have received satisfactory answers.
- I understand that I am not giving up any of my legal rights.
- I freely consent to participate in this research study.

[SIGNATURE LINE: PARTICIPANT]
[SIGNATURE LINE: PERSON OBTAINING CONSENT]
[SIGNATURE LINE: INVESTIGATOR]

--------------------------------------------------
END OF DOCUMENT
--------------------------------------------------`;
        
        setFormData(prev => ({ ...prev, extractedConsentText: mockConsentText }));
        setIsExtracting(false);
    };

    const handleSmartImport = () => {
        if (!smartImportText.trim()) return;
        setFormData(prev => ({ ...prev, extractedConsentText: smartImportText }));
        setShowAIImportModal(false);
        setSmartImportText('');
    };

    const consentFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.checked });
    };

    const handleNestedCheckboxChange = (group: string, field: string, checked: boolean) => {
        setFormData({
            ...formData,
            [group]: {
                ...(formData as any)[group],
                [field]: checked
            }
        });
    };

    const handleArrayToggle = (group: keyof typeof formData, value: string) => {
        const arr = formData[group] as string[];
        setFormData({
            ...formData,
            [group]: arr.includes(value) ? arr.filter(id => id !== value) : [...arr, value]
        });
    };

    const handleConsentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFormData({ ...formData, consentFormFile: file });
            handleAIExtraction(file);
        }
    };

    const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({
                ...formData,
                additionalDocuments: [...formData.additionalDocuments, ...Array.from(e.target.files)]
            });
        }
    };

    const removeAdditionalFile = (index: number) => {
        setFormData({
            ...formData,
            additionalDocuments: formData.additionalDocuments.filter((_, i) => i !== index)
        });
    };

    const handleSaveDraft = () => {
        const serializableData = {
            ...formData,
            consentFormFile: null, // Files cannot be serialized
            additionalDocuments: []
        };
        localStorage.setItem(`study_launch_draft_${formData.internalId || 'new'}`, JSON.stringify({ currentStep, formData: serializableData }));
        alert("Draft saved successfully! You can leave this page and your progress will be restored when you return.");
    };

    const handleResetForm = () => {
        localStorage.removeItem('study_launch_draft');
        window.location.reload();
    };

    useEffect(() => {
        if (!initialData) {
                    const savedDraft = localStorage.getItem(`study_launch_draft_${initialData?.protocol_id || 'new'}`) || localStorage.getItem('study_launch_draft');
                    if (savedDraft) {
                        const parsed = JSON.parse(savedDraft);
                        if (parsed.formData && window.confirm("We found an unsaved study draft. Would you like to resume where you left off?")) {
                            setFormData(prev => ({ ...prev, ...parsed.formData }));
                            if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                        } else {
                            localStorage.removeItem(`study_launch_draft_${initialData?.protocol_id || 'new'}`);
                        }
                    }
        } else {
            const existingQuestionnaires = Array.isArray(initialData.study_questionnaires)
                ? initialData.study_questionnaires.map((q: any) => q.template || q.template_details?.id).filter(Boolean)
                : [];
            const screenerQuestions = initialData.screener_config?.steps?.find((step: any) => step.type === 'user_input')?.questions || [];

            setFormData(prev => ({
                ...prev,
                internalId: initialData.protocol_id || prev.internalId,
                sponsor: initialData.sponsor_org_id || initialData.sponsor_org?.id || initialData.sponsor_name || '',
                startDate: initialData.start_date || '',
                endDate: initialData.end_date || '',
                fullTitle: initialData.full_title || initialData.title || '',
                shortTitle: initialData.title || '',
                category: initialData.condition || initialData.primary_indication || '',
                briefSummary: initialData.description || '',
                studyOverview: initialData.overview || '',
                benefits: initialData.benefit || '',
                participationMessage: initialData.participation_message || '',
                primaryModel: trialModelToLabel[initialData.trial_model] || initialData.trial_model || '',
                clinicalPhase: phaseToLabel[initialData.phase] || initialData.phase || 'N/A',
                maskingStrategy: maskingToLabel[initialData.masking_strategy] || initialData.masking_strategy || 'None (open label)',
                executionMode: studyTypeToLabel[initialData.study_type] || initialData.study_type || 'In-person',
                rewardType: rewardTypeToLabel[initialData.reward_type] || initialData.reward_type || 'Cash',
                incentiveLogic: rewardLogicToLabel[initialData.reward_logic] || initialData.reward_logic || 'Per study completion',
                stipendAmount: (initialData.reward_config?.amount || '').toString(),
                currency: initialData.compensation_currency || 'USD',
                requireStudyKit: Boolean(initialData.has_study_kit),
                studyKitDetails: initialData.kit_details || '',
                targetEnrollment: String(initialData.target_subjects || ''),
                selectedPIs: initialData.pi_ids || [],
                selectedCoordinators: initialData.coordinator_ids || [],
                selectedSponsorUsers: initialData.sponsor_ids || [],
                screenerQuestions,
                selectedQuestionnaires: existingQuestionnaires,
                extractedConsentText: initialData.consent_template || initialData.extracted_consent_text || ''
            }));
        }
    }, [initialData]);

    // Fetch team members from API on mount (fallback when props are empty)
    const fetchRef = useRef(false);
    useEffect(() => {
        // If parent is already providing users (even empty arrays), don't fetch
        if (availablePIs !== undefined || availableCoordinators !== undefined || availableSponsorUsers !== undefined) {
            return;
        }
        
        if (fetchRef.current) return;
        fetchRef.current = true;

        setTeamLoading(true);
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        const headers: any = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        fetch('/api/users/?limit=200', { headers })
            .then(r => r.json())
            .then(data => {
                const all: any[] = Array.isArray(data) ? data : (data?.results || []);
                setFetchedPIs(all.filter((u: any) => (u.role || '').toString().toUpperCase() === 'PI'));
                setFetchedCoordinators(all.filter((u: any) => (u.role || '').toString().toUpperCase() === 'COORDINATOR'));
                setFetchedSponsorUsers(all.filter((u: any) => (u.role || '').toString().toUpperCase() === 'SPONSOR'));
            })
            .catch(() => {})
            .finally(() => setTeamLoading(false));
    }, [availablePIs, availableCoordinators, availableSponsorUsers]);

    return (
        <div className="flex flex-col min-h-full w-full px-4 lg:px-8 2xl:px-12 max-w-[2800px] mx-auto text-white py-8 relative">
            
            {/* Modals */}
            <SponsorSearchModal 
                isOpen={isSponsorModalOpen} 
                onClose={() => setIsSponsorModalOpen(false)}
                onSelect={(s: any) => {
                    setFormData(prev => ({ ...prev, sponsor: s.id || s.name }));
                    setIsSponsorModalOpen(false);
                }}
                availableSponsors={availableSponsors}
                availableSponsorUsers={availableSponsorUsers}
                onAddOrg={() => { setIsSponsorModalOpen(false); setIsAddOrgModalOpen(true); }}
                onInviteDelegate={() => { setIsSponsorModalOpen(false); setIsInviteDelegateModalOpen(true); }}
            />
            <AddOrganizationModal isOpen={isAddOrgModalOpen} onClose={() => { setIsAddOrgModalOpen(false); setIsSponsorModalOpen(true); }} onSave={handleCreateOrg} />
            <InviteDelegateModal isOpen={isInviteDelegateModalOpen} onClose={() => { setIsInviteDelegateModalOpen(false); setIsSponsorModalOpen(true); }} onInvite={handleInviteDelegate} />

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Main Form Content */}
                <div className="flex-1 w-full order-2 lg:order-1">
                    {/* Header Menu (Stepper) */}
                    {/* Header Menu (Stepper) - Responsive Dropdown on Mobile, Tabs on Desktop */}
                    <div className="w-full max-w-6xl mx-auto mb-10">
                        {initialData && initialData.status !== 'DRAFT' && (
                            <div className="flex items-center justify-between mb-6">
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl w-fit"
                                >
                                    <DraftingCompass className="w-4 h-4 text-amber-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 italic">
                                        {isEditMode ? 'Edit Mode Active' : 'Audit Mode Active'}
                                    </span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isEditMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                                </motion.div>

                                <button
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`
                                        flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                        ${isEditMode 
                                            ? 'bg-amber-500 text-slate-900 shadow-xl shadow-amber-900/20' 
                                            : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}
                                    `}
                                >
                                    {isEditMode ? (
                                        <><Shield size={14} /> Lock & Audit</>
                                    ) : (
                                        <><Edit3 size={14} /> Modify Protocol</>
                                    )}
                                </button>
                            </div>
                        )}
                        {/* Mobile Dropdown */}
                        <div className="md:hidden flex flex-col gap-2">
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] ml-2">Current Step</label>
                            <div className="relative group">
                                <select
                                    value={currentStep}
                                    onChange={(e) => setCurrentStep(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    {STEPS.map((step) => (
                                        <option key={step.id} value={step.id} className="bg-[#0B101B]">
                                            Step {step.id}: {step.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hidden md:flex items-stretch bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            {STEPS.map((step, index) => {
                                const isActive = currentStep === step.id;
                                const isLast = index === STEPS.length - 1;

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => setCurrentStep(step.id)}
                                        className={`
                                            flex-1 py-5 px-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-1
                                            ${isActive
                                                ? 'bg-blue-600/20 text-blue-400 font-black relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-blue-500'
                                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}
                                            ${!isLast ? 'border-r border-white/5' : ''}
                                        `}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Step {step.id}</span>
                                        <span className={`text-[13px] font-bold tracking-tight ${step.label.includes('Questionnaires') ? 'leading-tight' : ''}`}>
                                            {step.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`w-full max-w-6xl mx-auto bg-[#0F172A] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl min-h-[600px] transition-all ${!isEditMode ? 'opacity-80 grayscale-[0.3]' : ''}`}>
                        <fieldset disabled={!isEditMode} className="contents">
                {currentStep === 1 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Protocol fundamentals</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Define the core identifiers for this study before proceeding.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">BASIC IDENTIFIERS</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Internal Study ID */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Internal study ID</label>
                                    <input
                                        type="text"
                                        name="internalId"
                                        value={formData.internalId}
                                        onChange={handleChange}
                                        placeholder="MUSB-2025-001"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                {/* Sponsor */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-200">Sponsor</label>
                                    <div
                                        onClick={() => setIsSponsorModalOpen(true)}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-between"
                                    >
                                        <span className={formData.sponsor ? "text-white" : "text-slate-500"}>
                                            {getSponsorDisplayName(formData.sponsor) || "Select Organization..."}
                                        </span>
                                        <Search size={16} className="text-slate-500" />
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Start date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">End date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation specifically for Step 1 */}
                        <div className="pt-4">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="w-full py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to study information <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 2 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Study information</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">This information will appear on participant-facing pages and portals.</p>
                        </div>

                        {/* TITLES CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">TITLES</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Official full title</label>
                                    <input
                                        type="text"
                                        name="fullTitle"
                                        value={formData.fullTitle}
                                        onChange={handleChange}
                                        placeholder="Full protocol title as registered"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#e0e0e0]">Public short title</label>
                                        <input
                                            type="text"
                                            name="shortTitle"
                                            value={formData.shortTitle}
                                            onChange={handleChange}
                                            placeholder="e.g. Beat the Bloat Study"
                                            className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#e0e0e0]">Study category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange as any}
                                            className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                        >
                                            <option value="">Select category</option>
                                            <option value="Gut Health">Gut Health</option>
                                            <option value="Metabolic Health">Metabolic Health</option>
                                            <option value="Aging">Aging</option>
                                            <option value="Women's Health">Women's Health</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PUBLIC-FACING CONTENT CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">PUBLIC-FACING CONTENT</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Brief summary (shown on eligibility page)</label>
                                    <textarea
                                        name="briefSummary"
                                        value={formData.briefSummary}
                                        onChange={handleChange as any}
                                        placeholder="e.g. Are you feeling gassy and bloated? You may qualify for this study."
                                        rows={3}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">
                                        Study overview
                                    </label>
                                    <BulletTextarea
                                        name="studyOverview"
                                        value={formData.studyOverview}
                                        mode={formData.textModes.studyOverview as 'bullet' | 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const newMode = prev.textModes.studyOverview === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.studyOverview) : addBulletsToText(prev.studyOverview);
                                            return { 
                                                ...prev, 
                                                studyOverview: newValue,
                                                textModes: { ...prev.textModes, studyOverview: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, studyOverview: val }))}
                                        placeholder={`Describe the study...`}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">
                                        Benefits for participants
                                    </label>
                                    <BulletTextarea
                                        name="benefits"
                                        value={formData.benefits}
                                        mode={formData.textModes.benefits as 'bullet' | 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const newMode = prev.textModes.benefits === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.benefits) : addBulletsToText(prev.benefits);
                                            return { 
                                                ...prev, 
                                                benefits: newValue,
                                                textModes: { ...prev.textModes, benefits: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, benefits: val }))}
                                        placeholder={`List participant benefits...`}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">
                                        Community participation message
                                    </label>
                                    <BulletTextarea
                                        name="participationMessage"
                                        value={formData.participationMessage}
                                        mode={formData.textModes.participationMessage as 'bullet' | 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const newMode = prev.textModes.participationMessage === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.participationMessage) : addBulletsToText(prev.participationMessage);
                                            return { 
                                                ...prev, 
                                                participationMessage: newValue,
                                                textModes: { ...prev.textModes, participationMessage: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, participationMessage: val }))}
                                        placeholder="Why should people participate?"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation specifically for Step 2 */}
                        <div className="pt-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to study design <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 3 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Study design</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Configure study structure, delivery, incentives, and consent method.</p>
                        </div>

                        {/* PRIMARY MODEL CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">PRIMARY MODEL</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {['Randomized controlled trial', 'Open label study', 'In-home use test', 'Patient repository', 'Observational study', 'Bioequivalence study'].map((model) => (
                                    <label key={model} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0B101B] cursor-pointer hover:border-blue-500 transition-colors">
                                        <input
                                            type="radio"
                                            name="primaryModel"
                                            value={model}
                                            checked={formData.primaryModel === model}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1"
                                        />
                                        <span className="text-sm font-medium text-white">{model}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Clinical phase</label>
                                    <select
                                        name="clinicalPhase"
                                        value={formData.clinicalPhase}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="N/A">N/A</option>
                                        <option value="Phase 1">Phase 1</option>
                                        <option value="Phase 2">Phase 2</option>
                                        <option value="Phase 3">Phase 3</option>
                                        <option value="Phase 4">Phase 4</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Masking strategy</label>
                                    <select
                                        name="maskingStrategy"
                                        value={formData.maskingStrategy}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="None (open label)">None (open label)</option>
                                        <option value="Single blind">Single blind</option>
                                        <option value="Double blind">Double blind</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Execution mode</label>
                                    <select
                                        name="executionMode"
                                        value={formData.executionMode}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="In-person">In-person</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* INCENTIVES CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">INCENTIVES</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Reward type</label>
                                    <select
                                        name="rewardType"
                                        value={formData.rewardType}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Gift Card">Gift Card</option>
                                        <option value="Product">Product</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Incentive logic</label>
                                    <select
                                        name="incentiveLogic"
                                        value={formData.incentiveLogic}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="Per study completion">Per study completion</option>
                                        <option value="Per visit">Per visit</option>
                                        <option value="Milestone based">Milestone based</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Stipend amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold pointer-events-none">
                                            {getCurrencySymbol(formData.currency)}
                                        </div>
                                        <input
                                            type="number"
                                            name="stipendAmount"
                                            value={formData.stipendAmount}
                                            onChange={handleChange}
                                            placeholder="e.g. 150"
                                            className="w-full bg-[#0B101B] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="AUD">AUD ($)</option>
                                        <option value="CAD">CAD ($)</option>
                                        <option value="JPY">JPY (¥)</option>
                                        <option value="CNY">CNY (¥)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="CHF">CHF (Fr)</option>
                                        <option value="NZD">NZD ($)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* STUDY KIT & ENROLLMENT CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">STUDY KIT & ENROLLMENT</h3>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="inline-flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0B101B] cursor-pointer hover:border-blue-500 transition-colors w-max pr-6">
                                        <input
                                            type="checkbox"
                                            name="requireStudyKit"
                                            checked={formData.requireStudyKit}
                                            onChange={handleCheckboxChange}
                                            className="w-4 h-4 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1"
                                        />
                                        <span className="text-sm font-medium text-white">Require study kit</span>
                                    </label>

                                    {formData.requireStudyKit && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                            <label className="text-sm font-medium text-[#e0e0e0]">Study kit details</label>
                                            <textarea
                                                name="studyKitDetails"
                                                value={formData.studyKitDetails}
                                                onChange={handleChange}
                                                placeholder="Enter components and instructions for the study kit..."
                                                rows={3}
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Target enrollment (number of participants)</label>
                                    <input
                                        type="number"
                                        name="targetEnrollment"
                                        value={formData.targetEnrollment}
                                        onChange={handleChange}
                                        placeholder="e.g. 60"
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CONSENT METHOD CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">CONSENT METHOD</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'eConsent', label: 'E-consent' },
                                    { key: 'paperConsent', label: 'Paper consent' },
                                    { key: 'remoteWitness', label: 'Remote witness' },
                                    { key: 'lar', label: 'Legal authorized representative (LAR)' },
                                    { key: 'parentGuardian', label: 'Parent / guardian' }
                                ].map((method) => (
                                    <label key={method.key} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0B101B] cursor-pointer hover:border-blue-500 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.consentMethods[method.key as keyof typeof formData.consentMethods]}
                                            onChange={(e) => handleNestedCheckboxChange('consentMethods', method.key, e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1"
                                        />
                                        <span className="text-sm font-medium text-white leading-tight">{method.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer Navigation specifically for Step 3 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to research team <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 4 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Research team</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Select or invite the personnel assigned to this study. They will be notified upon launch.</p>
                        </div>

                        {/* PIs CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">INVESTIGATOR(S) ({resolvedPIs.length})</h3>

                            <div className="space-y-4 mb-6">
                                {teamLoading && <p className="text-sm text-slate-400 italic">Loading team members...</p>}
                                {!teamLoading && resolvedPIs.length > 0 ? resolvedPIs.map((pi: any) => (
                                    <div key={pi.id} className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#1e4460] flex items-center justify-center text-[#5daee9] font-bold text-sm">
                                                {pi.first_name?.[0] || ''}{pi.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">{pi.first_name} {pi.last_name}</span>
                                                    <span className="text-[10px] bg-[#1e4460] text-[#5daee9] px-2 py-0.5 rounded font-bold uppercase">PI</span>
                                                </div>
                                                <div className="text-sm text-gray-400">{pi.organization || 'MusB Research Institute'}</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(formData.selectedPIs as string[]).includes(pi.id)}
                                            onChange={() => handleArrayToggle('selectedPIs', pi.id)}
                                            className="w-5 h-5 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                                        />
                                    </div>
                                )) : (
                                    !teamLoading && <p className="text-sm text-gray-500 italic pb-4 border-b border-white/10">No available PIs found in database.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="email"
                                    name="invitePIEmail"
                                    value={formData.invitePIEmail}
                                    onChange={handleChange}
                                    placeholder="Invite PI by email address"
                                    className="flex-1 bg-[#0B101B] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                    Send invite
                                </button>
                            </div>
                        </div>

                        {/* CLINICAL COORDINATORS CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">CLINICAL COORDINATORS ({resolvedCoordinators.length})</h3>

                            <div className="space-y-4 mb-6">
                                {teamLoading && <p className="text-sm text-slate-400 italic">Loading...</p>}
                                {!teamLoading && resolvedCoordinators.length > 0 ? resolvedCoordinators.map((coord: any) => (
                                    <div key={coord.id} className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#1e4a2a] flex items-center justify-center text-[#5de97a] font-bold text-sm shrink-0">
                                                {coord.first_name?.[0] || ''}{coord.last_name?.[0] || ''}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-white truncate">{coord.first_name} {coord.last_name}</span>
                                                    <span className="text-[10px] bg-[#1e4a2a] text-[#5de97a] px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">Coordinator</span>
                                                </div>
                                                <div className="text-sm text-gray-400 truncate">{coord.organization || 'MusB Research Institute'}</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(formData.selectedCoordinators as string[]).includes(coord.id)}
                                            onChange={() => handleArrayToggle('selectedCoordinators', coord.id)}
                                            className="w-5 h-5 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1 cursor-pointer sm:ml-auto"
                                        />
                                    </div>
                                )) : (
                                    !teamLoading && <p className="text-sm text-gray-500 italic pb-4 border-b border-white/10">No available coordinators found in database.</p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <input
                                    type="email"
                                    name="inviteCoordinatorEmail"
                                    value={formData.inviteCoordinatorEmail}
                                    onChange={handleChange}
                                    placeholder="Invite coordinator by email address"
                                    className="flex-1 bg-[#0B101B] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                    Send invite
                                </button>
                            </div>
                        </div>

                        {/* SPONSOR PERSONNEL CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">SPONSOR PERSONNEL ({resolvedSponsorUsers.length})</h3>

                            <div className="space-y-4 mb-6">
                                {teamLoading && <p className="text-sm text-slate-400 italic">Loading...</p>}
                                {!teamLoading && resolvedSponsorUsers.length > 0 ? resolvedSponsorUsers.map((sponsor: any) => (
                                    <div key={sponsor.id} className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 last:border-0 last:pb-0 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#52411e] flex items-center justify-center text-[#e9b85d] font-bold text-sm shrink-0">
                                                {sponsor.first_name?.[0] || ''}{sponsor.last_name?.[0] || ''}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-white truncate">{sponsor.first_name} {sponsor.last_name}</span>
                                                    <span className="text-[10px] bg-[#52411e] text-[#e9b85d] px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">Sponsor</span>
                                                </div>
                                                <div className="text-sm text-gray-400 truncate">{sponsor.organization || 'External Sponsor Org'}</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(formData.selectedSponsorUsers as string[]).includes(sponsor.id)}
                                            onChange={() => handleArrayToggle('selectedSponsorUsers', sponsor.id)}
                                            className="w-5 h-5 rounded text-blue-400 bg-transparent border-gray-500 focus:ring-blue-500 focus:ring-1 cursor-pointer sm:ml-auto"
                                        />
                                    </div>
                                )) : (
                                    !teamLoading && <p className="text-sm text-gray-500 italic pb-4 border-b border-white/10">No available sponsor personnel found in database.</p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <input
                                    type="email"
                                    name="inviteSponsorEmail"
                                    value={formData.inviteSponsorEmail}
                                    onChange={handleChange}
                                    placeholder="Invite sponsor contact by email address"
                                    className="flex-1 bg-[#0B101B] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                    Send invite
                                </button>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm md:text-base text-center mt-2 mb-4">
                            Selected personnel will be automatically assigned to this study upon launch and will receive portal access.
                        </p>

                        {/* Footer Navigation specifically for Step 4 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to screening form <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 5 ? (
                    <div className="space-y-6">
                        <ScreenerBuilder
                            standalone={true}
                            initialQuestions={formData.screenerQuestions}
                            onSave={(questions) => {
                                setFormData({ ...formData, screenerQuestions: questions });
                            }}
                        />

                        {/* Footer Navigation specifically for Step 5 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(6)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to questionnaires <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 6 ? (
                    <div className="space-y-6">
                        <QuestionnaireBuilder
                            selectedTemplates={formData.selectedQuestionnaires}
                            onSelectTemplate={(id) => handleArrayToggle('selectedQuestionnaires', id)}
                        />

                        {/* Footer Navigation specifically for Step 6 */}
                        <div className="pt-8 flex items-center justify-between gap-4 mt-8 border-t border-white/10">
                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(7)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to documents <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 7 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Study documents</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Upload required documents. The consent form will appear in the participant portal for electronic signature if e-consent was selected.</p>
                        </div>

                        {/* INFORMED CONSENT FORM CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">INFORMED CONSENT FORM</h3>
                                <button
                                    onClick={() => setShowAIImportModal(true)}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg text-[10px] font-bold text-pink-500 uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all"
                                >
                                    <Terminal className="w-3.5 h-3.5" /> AI Extract
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={consentFileInputRef}
                                onChange={handleConsentFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                            />

                            {formData.consentFormFile ? (
                                <div className="p-6 border border-white/10 bg-[#0B101B] rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{formData.consentFormFile.name}</p>
                                            <p className="text-sm text-gray-500">{(formData.consentFormFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, consentFormFile: null })}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => consentFileInputRef.current?.click()}
                                    className="border-2 border-dashed border-pink-500/20 bg-pink-500/5 hover:border-pink-500/50 transition-all rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer text-center group"
                                >
                                    <Upload className="w-10 h-10 text-pink-500 mb-6 group-hover:scale-110 transition-transform" />
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Upload Doc</h4>
                                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">AI Extraction</p>
                                </div>
                            )}

                            {/* AI EXTRACTION ENGINE HUD */}
                            {isExtracting && (
                                <div className="mt-6 p-10 border-2 border-dashed border-pink-500/20 bg-pink-500/5 rounded-xl flex flex-col items-center justify-center gap-4 animate-pulse">
                                    <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                    <div className="text-center">
                                        <p className="text-pink-500 font-black uppercase tracking-[0.2em] text-xs mb-1">AI Extraction Engine</p>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Analyzing legal clauses & structures...</p>
                                    </div>
                                </div>
                            )}

                            {formData.extractedConsentText && (
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Extracted Content Review</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Formatting buttons removed to prevent confusing raw tags in textarea */}
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            value={formData.extractedConsentText}
                                            onChange={(e) => setFormData({ ...formData, extractedConsentText: e.target.value })}
                                            rows={formData.extractedConsentText ? Math.max(15, formData.extractedConsentText.split('\n').length + 2) : 12}
                                            className="w-full h-auto bg-black/40 border border-white/10 rounded-xl p-6 text-sm text-slate-300 leading-relaxed outline-none focus:border-pink-500/50 resize-none font-sans"
                                            placeholder="Review extracted text here..."
                                        />
                                        
                                        {/* Clinical Oversight Signatures HUD */}
                                        <div className="absolute bottom-16 right-6 w-80 p-5 bg-[#0B101B]/90 backdrop-blur-xl border border-pink-500/20 rounded-2xl shadow-2xl space-y-5">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Oversight Signatures</p>
                                                <Shield className="w-3 h-3 text-pink-500" />
                                            </div>
                                            
                                            {/* Participant */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">01. Participant</span>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Awaiting Signature</span>
                                                </div>
                                                <div className="h-12 border border-dashed border-pink-500/20 rounded-lg flex items-center justify-center bg-pink-500/5 relative overflow-hidden">
                                                     <div className="text-[9px] font-bold text-pink-500/30 uppercase italic tracking-tighter">Digital Signature Placeholder</div>
                                                     <div className="absolute bottom-1.5 left-2 right-2 h-[1px] bg-pink-500/10" />
                                                </div>
                                            </div>

                                            {/* Coordinator */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">02. Coordinator</span>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Verification Required</span>
                                                </div>
                                                <div className="h-12 border border-dashed border-blue-400/20 rounded-lg flex items-center justify-center bg-blue-400/5 relative overflow-hidden">
                                                     <div className="text-[9px] font-bold text-blue-400/30 uppercase italic tracking-tighter">Co-Sign Placeholder</div>
                                                     <div className="absolute bottom-1.5 left-2 right-2 h-[1px] bg-blue-400/10" />
                                                </div>
                                            </div>

                                            {/* PI */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">03. Principal Inv.</span>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Final Approval</span>
                                                </div>
                                                <div className="h-12 border border-dashed border-emerald-400/20 rounded-lg flex items-center justify-center bg-emerald-400/5 relative overflow-hidden">
                                                     <div className="text-[9px] font-bold text-emerald-400/30 uppercase italic tracking-tighter">Oversight Placeholder</div>
                                                     <div className="absolute bottom-1.5 left-2 right-2 h-[1px] bg-emerald-400/10" />
                                                </div>
                                            </div>

                                            <div className="pt-3 flex justify-between items-center border-t border-white/5">
                                                <div className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">21 CFR Part 11 Compliant</div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                                                    <div className="text-[8px] font-black text-pink-500 uppercase tracking-widest">E-VERIFIED</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-4 flex gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B101B] border border-white/10 rounded-full shadow-xl">
                                                <Shield className="w-3 h-3 text-blue-400" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PII Masked</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B101B] border border-white/10 rounded-full shadow-xl">
                                                <Database className="w-3 h-3 text-emerald-400" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NLP Validated</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button 
                                            onClick={() => setFormData({ ...formData, extractedConsentText: '' })}
                                            className="px-6 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            Discard
                                        </button>
                                        <button className="px-8 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-600/20">
                                            Apply to E-Consent Template
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ADDITIONAL STUDY DOCUMENTS CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">ADDITIONAL STUDY DOCUMENTS</h3>

                            <input
                                type="file"
                                ref={additionalFileInputRef}
                                onChange={handleAdditionalFilesChange}
                                className="hidden"
                                multiple
                            />

                            <div
                                onClick={() => additionalFileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 bg-[#0B101B] hover:border-blue-500 hover:bg-blue-600/5 transition-all rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer text-center mb-6"
                            >
                                <Upload className="w-6 h-6 text-slate-400 mb-4" />
                                <p className="text-white font-medium">Upload protocol, IRB approval, or other documents</p>
                            </div>

                            {formData.additionalDocuments.length > 0 && (
                                <div className="space-y-3">
                                    {formData.additionalDocuments.map((file, idx) => (
                                        <div key={idx} className="p-4 border border-white/10 bg-[#0B101B] rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-gray-700 text-gray-300 rounded-lg flex items-center justify-center">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeAdditionalFile(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Navigation specifically for Step 7 */}
                        <div className="pt-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStep(6)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={() => setCurrentStep(8)}
                                className="w-1/2 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to review <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 8 ? (
                    <div className="space-y-6">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white">Review & launch</h2>
                            <p className="text-gray-400 mt-2">Review your study configuration before submitting. Missing fields are highlighted below.</p>
                        </div>

                        {/* PROTOCOL */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">01. Protocol Identification</h3>
                                <button onClick={() => setCurrentStep(1)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                    <DraftingCompass className="w-3 h-3" /> Edit Section
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Internal ID</span>
                                        <p className="text-sm text-white font-bold italic">{formData.internalId || 'Not set'}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Timeline</span>
                                        <p className="text-sm text-white font-bold italic">{formData.startDate || 'TBD'} — {formData.endDate || 'TBD'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sponsor Organization</span>
                                        <p className="text-sm text-blue-400 font-black uppercase italic">{getSponsorDisplayName(formData.sponsor) || 'Internal'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STUDY CONTENT */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">02. Descriptive Content</h3>
                                <button onClick={() => setCurrentStep(2)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                    <DraftingCompass className="w-3 h-3" /> Edit Section
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Official Title</span>
                                        <p className="text-sm text-white font-bold italic">{formData.fullTitle || 'Untitled'}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Public Name</span>
                                        <p className="text-sm text-white font-bold italic">{formData.shortTitle || 'Untitled'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Brief Summary</span>
                                        <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">{formData.briefSummary || 'No summary provided'}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Overview</span>
                                            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-tighter italic">{formData.studyOverview ? 'Configured' : 'Missing'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Benefits</span>
                                            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-tighter italic">{formData.benefits ? 'Configured' : 'Missing'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Message</span>
                                            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-tighter italic">{formData.participationMessage ? 'Configured' : 'Missing'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CLINICAL DESIGN & COMPENSATION */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">03. Design, Compensation & Logistics</h3>
                                <button onClick={() => setCurrentStep(3)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                    <DraftingCompass className="w-3 h-3" /> Edit Section
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Model</span>
                                    <p className="text-xs text-white font-bold uppercase italic">{formData.primaryModel || 'RCT'}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Phase</span>
                                    <p className="text-xs text-white font-bold uppercase italic">{formData.clinicalPhase || 'N/A'}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Enrollment</span>
                                    <p className="text-xs text-white font-bold uppercase italic">{formData.targetEnrollment || '0'} Subjects</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Stipend</span>
                                    <p className="text-xs text-emerald-400 font-black uppercase italic">
                                        {getCurrencySymbol(formData.currency)}
                                        {formData.stipendAmount || '0'} ({formData.rewardType})
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Study Kit</span>
                                    <p className="text-xs text-white font-bold uppercase italic">{formData.requireStudyKit ? 'Required' : 'None'}</p>
                                </div>
                                {formData.requireStudyKit && formData.studyKitDetails && (
                                    <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-[#0B101B] border border-white/5 rounded-lg">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Kit Logistics</span>
                                        <p className="text-[11px] text-slate-400 italic line-clamp-2">{formData.studyKitDetails}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TEAM & DESIGN */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">04. Operational Team</h3>
                                <button onClick={() => setCurrentStep(4)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                    <DraftingCompass className="w-3 h-3" /> Edit Section
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-slate-300 font-medium italic">Investigator(s)</span>
                                    {formData.selectedPIs.length > 0 ? (
                                        <span className="text-sm text-emerald-400 font-bold uppercase tracking-tight italic">
                                            {formData.selectedPIs.map(id => {
                                                const person = resolvedPIs?.find(p => String(p.id) === String(id));
                                                return person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() || id : id;
                                            }).join(', ')}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-red-400 italic">Not assigned</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-slate-300 font-medium italic">Coordinators</span>
                                    {formData.selectedCoordinators.length > 0 ? (
                                        <span className="text-sm text-emerald-400 font-bold uppercase tracking-tight italic">
                                            {formData.selectedCoordinators.map(id => {
                                                const person = resolvedCoordinators?.find(c => String(c.id) === String(id));
                                                return person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() || id : id;
                                            }).join(', ')}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-red-400 italic">Not assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* WORKFLOWS */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">05. Digital Workflows</h3>
                                <div className="flex gap-4">
                                    <button onClick={() => setCurrentStep(5)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                        <DraftingCompass className="w-3 h-3" /> Screener
                                    </button>
                                    <button onClick={() => setCurrentStep(6)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                        <DraftingCompass className="w-3 h-3" /> Questionnaires
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Screener Form</span>
                                    <p className={`text-xs font-bold uppercase italic ${formData.screenerQuestions.length > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formData.screenerQuestions.length > 0 ? `${formData.screenerQuestions.length} Questions Configured` : 'Not Configured'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Instruments</span>
                                    <p className={`text-xs font-bold uppercase italic ${formData.selectedQuestionnaires.length > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formData.selectedQuestionnaires.length > 0 ? `${formData.selectedQuestionnaires.length} Questionnaires Assigned` : 'None Assigned'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DOCUMENTS */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">06. Regulatory Documents</h3>
                                <button onClick={() => setCurrentStep(7)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                    <DraftingCompass className="w-3 h-3" /> Edit Section
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300 font-medium italic">Master Consent Template</span>
                                {formData.consentFormFile ? (
                                    <span className="text-sm text-emerald-400 font-bold uppercase tracking-tight italic">{formData.consentFormFile.name}</span>
                                ) : (
                                    <span className="text-sm text-yellow-500 italic">No File Uploaded</span>
                                )}
                            </div>
                        </div>

                        {/* Footer Navigation */}
                        <div className="pt-4 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStep(7)}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl leading-none">&larr;</span> Back
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={!isEditMode}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center disabled:opacity-40"
                            >
                                Save as draft
                            </button>
                            <button
                                onClick={handleResetForm}
                                disabled={!isEditMode}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center disabled:opacity-40"
                            >
                                Reset form
                            </button>
                            <button
                                onClick={async () => {
                                    if (!onSave || isSubmitting) return;
                                    try {
                                        setIsSubmitting(true);
                                        await onSave(formData);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting || !isEditMode}
                                className="w-1/4 py-4 rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting 
                                    ? (initialData ? 'Saving...' : 'Launching...') 
                                    : (initialData ? (isEditMode ? 'Save Protocol Changes' : 'Locked') : 'Preview & launch study')}
                            </button>
                        </div>
                    </div>
                ) : null}
                </fieldset>
                </div>
                </div>

                {/* Live Summary Sidebar - Fulfilling "show all details when we start filling" */}
                <div className="w-full lg:w-80 2xl:w-96 shrink-0 order-1 lg:order-2 lg:sticky lg:top-8">
                    <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-8">
                        <div>
                            <div className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase mb-4">Live Study Summary</div>
                            
                            {/* Key Identity */}
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Protocol Identification</div>
                                    <div className="text-sm font-black text-white italic truncate">{formData.internalId || 'PENDING ID'}</div>
                                    <div className="text-[11px] font-bold text-blue-400 mt-1 truncate">{formData.shortTitle || 'UNTITLED STUDY'}</div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sponsor Entity</div>
                                    <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                                        <Building2 size={14} className="text-slate-500" />
                                        {formData.sponsor ? getSponsorDisplayName(formData.sponsor) : <span className="text-slate-600 italic">None selected</span>}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline</div>
                                    <div className="text-xs font-bold text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-500" />
                                        {formData.startDate || '??'} → {formData.endDate || '??'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Indicators */}
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completion</span>
                                <span className="text-xs font-black text-white italic">{Math.round((currentStep / STEPS.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                />
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl">
                            <div className="flex gap-3">
                                <Sparkles size={16} className="text-blue-400 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">PRO TIP</div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">Study identifiers like Internal ID are required for billing and IRB tracking. Ensure accuracy before launch.</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveDraft} className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Upload size={14} className="text-slate-400" />
                            Save Progress Draft
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showAIImportModal && (
                    <React.Fragment>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAIImportModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]" />
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 m-auto w-full max-w-2xl h-fit bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-10 z-[201] shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowAIImportModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                        <Terminal className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">AI Consent Import</h3>
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Paste raw text to generate an automated e-consent draft</p>
                            </div>
                            <textarea
                                value={smartImportText}
                                onChange={(e) => setSmartImportText(e.target.value)}
                                placeholder="Paste protocol or consent language here..."
                                className="w-full h-72 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-slate-300 outline-none focus:border-pink-500/50 mb-8 resize-none font-sans leading-relaxed"
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setShowAIImportModal(false)} className="flex-1 py-4 rounded-xl font-black text-[11px] tracking-widest uppercase text-slate-500 hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={handleSmartImport} className="flex-[2] py-4 rounded-xl font-black text-[11px] tracking-widest uppercase bg-pink-600 text-white hover:bg-pink-500 transition-all shadow-xl shadow-pink-900/20">Process & Import</button>
                            </div>
                        </motion.div>
                    </React.Fragment>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LaunchStudyForm;