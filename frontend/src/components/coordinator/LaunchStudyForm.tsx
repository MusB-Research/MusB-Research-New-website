import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Search, Building2, Calendar, Sparkles, Terminal, FileText, Database, Shield, Bold, Italic, Underline, Link, ChevronDown, DraftingCompass, Edit3, Users, Info, Layout, AlertTriangle, Download, ClipboardList, CheckCircle2, ShieldCheck, Globe, Plus } from 'lucide-react';
import ScreenerBuilder from './ScreenerBuilder';
import QuestionnaireBuilder from './QuestionnaireBuilder';
import { motion, AnimatePresence } from 'framer-motion';

import { getCurrencySymbol, formatCurrency } from '../../utils/format';
import { authFetch } from '../../utils/auth';
import { MarkdownText } from '../shared/MarkdownText';

interface LaunchStudyFormProps {
    onClose?: () => void;
    onSave?: (data: any, documentsToUpload?: any[]) => void | boolean | Promise<void | boolean>;
    initialData?: any;
    availablePIs?: any[];
    availableCoordinators?: any[];
    availableSponsors?: any[];
    availableSponsorUsers?: any[];
}



const STEPS = [
    { id: 1, label: 'Protocol' },
    { id: 2, label: 'Study info' },
    { id: 3, label: 'Design' },
    { id: 4, label: 'Team' },
    { id: 5, label: 'Screening' },
    { id: 6, label: 'Questionnaires' },
    { id: 7, label: 'Documents' },
    { id: 8, label: 'Launch Review' },
];

const SponsorSearchModal = ({ isOpen, onClose, onSelect, availableSponsors, availableSponsorUsers, onAddOrg, onInviteDelegate }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [orgs, setOrgs] = useState<any[]>([]);
    const [individuals, setIndividuals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        Promise.all([
            availableSponsors && availableSponsors.length > 0
                ? Promise.resolve(availableSponsors)
                : authFetch('/api/sponsor-organizations/?limit=100').then(r => r.json()).then(d => Array.isArray(d) ? d : (d?.results || [])),
            availableSponsorUsers && availableSponsorUsers.length > 0
                ? Promise.resolve(availableSponsorUsers)
                : authFetch('/api/users/?limit=100').then(r => r.json()).then(d => (Array.isArray(d) ? d : (d?.results || [])).filter((u: any) => (u.role || '').toString().toUpperCase() === 'SPONSOR'))
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
        className={`p-2 rounded-lg hover:bg-white/10 transition-all ${active ? 'text-blue-400 bg-white/5' : 'text-slate-400 hover:text-white'}`}
    >
        <Icon size={16} />
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
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                    <ToolbarButton icon={Bold} onClick={() => insertText('**', '**')} />
                    <ToolbarButton icon={Italic} onClick={() => insertText('_', '_')} />
                    <ToolbarButton icon={Underline} onClick={() => insertText('<u>', '</u>')} />
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <ToolbarButton icon={Link} onClick={() => insertText('link')} />
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <ToolbarButton icon={X} onClick={() => onChange('')} />
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
            
            {value && (value.includes('**') || value.includes('_') || value.includes('<u>') || value.includes('[') || value.includes('•')) && (
                <div className="mt-2 p-4 bg-white/5 border border-dashed border-white/10 rounded-xl">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles size={10} className="text-blue-400" />
                        LIVE PREVIEW
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed font-medium">
                        {mode === 'bullet' ? (
                            <ul className="space-y-1">
                                {value.split('\n').filter(Boolean).map((line, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-blue-400 font-bold">•</span>
                                        <MarkdownText text={line.replace(/^[•\-\*]\s*/, '')} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <MarkdownText text={value} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Manual currency Signs removed in favor of Intl.NumberFormat utility

const CountrySelector = ({ selectedCountries, onChange }: { selectedCountries: string[], onChange: (countries: string[]) => void }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const countries = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
        "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
        "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
        "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia",
        "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt",
        "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
        "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
        "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
        "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "North Korea", "South Korea", "Kuwait",
        "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
        "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
        "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
        "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan",
        "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
        "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
        "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain",
        "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
        "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
        "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
        "Zambia", "Zimbabwe"
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleCountry = (c: string) => {
        if (selectedCountries.includes(c)) {
            onChange(selectedCountries.filter(item => item !== c));
        } else {
            onChange([...selectedCountries, c]);
        }
    };

    const filtered = countries.filter(c => 
        c.toLowerCase().includes(search.toLowerCase()) && 
        !selectedCountries.includes(c)
    );

    return (
        <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-3xl relative" ref={containerRef}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Globe size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Global Reach</label>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Recruitment Coverage</h4>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full uppercase tracking-widest">
                        {selectedCountries.length} Countries Selected
                    </span>
                </div>
            </div>

            {/* Selected Tags Area */}
            {selectedCountries.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-[#0B101B]/50 border border-white/5 rounded-2xl min-h-[50px] items-center">
                    <AnimatePresence>
                        {selectedCountries.map(c => (
                            <motion.div 
                                key={c}
                                initial={{ opacity: 0, scale: 0.9, x: -5 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 5 }}
                                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 group hover:bg-blue-600/20 transition-all cursor-default"
                            >
                                <span className="text-[11px] font-black uppercase tracking-tight">{c}</span>
                                <button 
                                    type="button" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCountry(c);
                                    }}
                                    className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-blue-400/50"
                                >
                                    <X size={12} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Dropdown Container */}
            <div className="relative">
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group relative flex items-center gap-3 bg-[#0B101B] border rounded-2xl p-4 transition-all cursor-text shadow-inner ${
                        isOpen ? 'border-blue-500/50 ring-4 ring-blue-500/10' : 'border-white/10 hover:border-white/20'
                    }`}
                >
                    <Search className={`transition-colors duration-300 ${isOpen ? 'text-blue-400' : 'text-slate-500'}`} size={18} />
                    <input 
                        type="text" 
                        placeholder={selectedCountries.length === 0 ? "Search for participating countries..." : "Add more countries..."}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none font-bold tracking-tight italic"
                    />
                    <ChevronDown className={`text-slate-500 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-blue-400' : ''}`} size={20} />
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="absolute left-0 right-0 mt-3 z-[100] bg-[#0F172A] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                        >
                            <div className="max-h-[300px] overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {filtered.length === 0 ? (
                                    <div className="p-10 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                            <Search className="text-slate-700" size={20} />
                                        </div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">
                                            {search ? `No matches for "${search}"` : "All regions selected"}
                                        </div>
                                    </div>
                                ) : (
                                    filtered.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCountry(c);
                                                setSearch('');
                                            }}
                                            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-blue-600/10 border border-transparent hover:border-blue-500/20 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors" />
                                                <span className="text-sm font-black text-slate-400 group-hover:text-white uppercase tracking-tighter transition-colors">{c}</span>
                                            </div>
                                            <Plus size={16} className="text-slate-700 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                        </button>
                                    ))
                                )}
                            </div>
                            
                            {filtered.length > 0 && (
                                <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{filtered.length} Regions Available</span>
                                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">MusB Global Intelligence</div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {selectedCountries.length === 0 && !isOpen && (
                <div className="flex items-center gap-2 mt-4 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action Required: Define recruitment territories</span>
                </div>
            )}
        </div>
    );
};

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
        try {
            const res = await authFetch('/api/sponsor-organizations/', {
                method: 'POST',
                body: JSON.stringify(orgData)
            });
            if (res.ok) {
                const newOrg = await res.json();
                setIsAddOrgModalOpen(false);
                setIsSponsorModalOpen(true); // Re-open parent
                alert(`Organization ${newOrg.name} created!`);
            } else {
                const err = await res.json();
                alert(`Failed to create organization: ${JSON.stringify(err)}`);
            }
        } catch (e) { 
            console.error(e);
            alert("Failed to create organization"); 
        }
    };

    const handleInviteDelegate = async (inviteData: any) => {
        try {
            const res = await authFetch('/api/invitations/', {
                method: 'POST',
                body: JSON.stringify({ 
                    ...inviteData, 
                    role: 'SPONSOR',
                    organization: formData.sponsor || 'MusB Research'
                })
            });
            if (res.ok) {
                setIsInviteDelegateModalOpen(false);
                setIsSponsorModalOpen(true);
                alert(`Invitation sent to ${inviteData.email}!`);
            } else {
                const err = await res.json();
                alert(`Failed to send invitation: ${JSON.stringify(err)}`);
            }
        } catch (e) { 
            console.error(e);
            alert("Failed to send invitation - Network or Server Error"); 
        }
    };

    const handleInvitePI = async () => {
        if (!formData.invitePIEmail) return;
        try {
            const res = await authFetch('/api/invitations/', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: formData.invitePIEmail, 
                    first_name: formData.invitePIFirstName,
                    last_name: formData.invitePILastName,
                    role: 'PI',
                    organization: formData.sponsor || 'MusB Research' 
                })
            });
            if (res.ok) {
                alert(`Invitation sent to ${formData.invitePIEmail}!`);
                setFormData(prev => ({ 
                    ...prev, 
                    invitePIEmail: '',
                    invitePIFirstName: '',
                    invitePILastName: ''
                }));
            } else {
                const err = await res.json();
                alert(`Failed to send invitation: ${JSON.stringify(err)}`);
            }
        } catch (e) { 
            console.error(e);
            alert("Failed to send invitation - Network or Server Error"); 
        }
    };

    const handleInviteCoordinator = async () => {
        if (!formData.inviteCoordinatorEmail) return;
        try {
            const res = await authFetch('/api/invitations/', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: formData.inviteCoordinatorEmail, 
                    first_name: formData.inviteCoordinatorFirstName,
                    last_name: formData.inviteCoordinatorLastName,
                    role: 'COORDINATOR',
                    organization: formData.sponsor || 'MusB Research'
                })
            });
            if (res.ok) {
                alert(`Invitation sent to ${formData.inviteCoordinatorEmail}!`);
                setFormData(prev => ({ 
                    ...prev, 
                    inviteCoordinatorEmail: '',
                    inviteCoordinatorFirstName: '',
                    inviteCoordinatorLastName: ''
                }));
            } else {
                const err = await res.json();
                alert(`Failed to send invitation: ${JSON.stringify(err)}`);
            }
        } catch (e) { 
            console.error(e);
            alert("Failed to send invitation - Network or Server Error"); 
        }
    };

    const handleInviteSponsor = async () => {
        if (!formData.inviteSponsorEmail) return;
        try {
            const res = await authFetch('/api/invitations/', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: formData.inviteSponsorEmail, 
                    first_name: formData.inviteSponsorFirstName,
                    last_name: formData.inviteSponsorLastName,
                    role: 'SPONSOR',
                    organization: formData.sponsor || 'MusB Research'
                })
            });
            if (res.ok) {
                alert(`Invitation sent to ${formData.inviteSponsorEmail}!`);
                setFormData(prev => ({ 
                    ...prev, 
                    inviteSponsorEmail: '',
                    inviteSponsorFirstName: '',
                    inviteSponsorLastName: ''
                }));
            } else {
                const err = await res.json();
                alert(`Failed to send invitation: ${JSON.stringify(err)}`);
            }
        } catch (e) { 
            console.error(e);
            alert("Failed to send invitation - Network or Server Error"); 
        }
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

    const ReviewRow = ({ label, value, placeholder = 'Not provided', truncate = false, isCritical = false }: any) => (
        <div className="flex items-center justify-between px-8 py-5 group hover:bg-white/[0.02] transition-colors">
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest shrink-0">{label}</span>
            <div className="flex items-center gap-3 max-w-[70%] overflow-hidden text-right">
                {isCritical && !value && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs font-black text-red-500 uppercase tracking-tighter shrink-0">
                        <AlertTriangle size={12} /> MISSING
                    </div>
                )}
                <span className={`text-base font-bold ${value ? 'text-white' : 'text-slate-600 italic'} ${truncate ? 'truncate' : ''}`}>
                    {value || placeholder}
                </span>
            </div>
        </div>
    );
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

    const SignaturePlaceholder = ({ label, status, color }: any) => {
        const colors: any = {
            pink: 'text-pink-400 bg-pink-500/5 border-pink-500/20',
            blue: 'text-blue-400 bg-blue-500/5 border-blue-500/20',
            emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
        };
        return (
            <div className={`p-3 rounded-xl border border-dashed ${colors[color]} space-y-1`}>
                <div className="text-[8px] font-black uppercase tracking-widest">{label}</div>
                <div className="text-[10px] font-bold italic opacity-60 uppercase tracking-tighter leading-none">{status}</div>
                <div className="h-[20px] flex items-end justify-center">
                    <div className="w-full h-[1px] bg-white/10" />
                </div>
            </div>
        );
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
        if (!value) return null;
        // Try to find in organizations
        const org = (availableSponsors || []).find((s: any) => s.id === value || s.name === value || s.organization === value);
        if (org) return org.organization || org.name || value;
        // Try to find in sponsor users
        const user = (availableSponsorUsers || []).find((u: any) => u.id === value || u.email === value);
        if (user) return `${user.first_name} ${user.last_name}`;
        return value;
    };

    // Form State
    const [formData, setFormData] = useState({
        protocol_id: 'MUSB-2025-001',
        sponsor: '',
        startDate: '',
        endDate: '',
        full_title: '',
        title: '',
        category: '',
        briefSummary: '',
        overview: '',
        benefit: '',
        participation_message: '',
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
            overview: 'bullet',
            benefit: 'bullet',
            participation_message: 'bullet',
            briefSummary: 'plain',
            studyKitDetails: 'plain'
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
        invitePIFirstName: '',
        invitePILastName: '',
        inviteCoordinatorEmail: '',
        inviteCoordinatorFirstName: '',
        inviteCoordinatorLastName: '',
        inviteSponsorEmail: '',
        inviteSponsorFirstName: '',
        inviteSponsorLastName: '',
        screenerQuestions: [] as any[],
        screenerFile: null as File | null,
        selectedQuestionnaires: [] as string[],
        questionnaireDetails: [] as any[],
        questionnaireFrequencies: {} as Record<string, string>,
        consentFormFile: null as File | null,
        extractedConsentText: '',
        additionalDocuments: [] as File[],
        countries: [] as string[]
    });

    const [isExtracting, setIsExtracting] = useState(false);
    const [showAIImportModal, setShowAIImportModal] = useState(false);
    const [smartImportText, setSmartImportText] = useState('');
    const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);

    const handleAIExtraction = async (file: File) => {
        setIsExtracting(true);
        try {
            const body = new FormData();
            body.append('file', file);
            const res = await authFetch('/api/study-consent/extract/', {
                method: 'POST',
                body
            });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, extractedConsentText: data.text || '' }));
            } else {
                // Fallback: let user know extraction failed but don't block
                console.warn('PDF extraction returned non-OK status, text will be empty.');
                setFormData(prev => ({ ...prev, extractedConsentText: '' }));
            }
        } catch (err) {
            console.error('PDF extraction failed:', err);
            setFormData(prev => ({ ...prev, extractedConsentText: '' }));
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSmartImport = () => {
        if (!smartImportText.trim()) return;
        setFormData(prev => ({ ...prev, extractedConsentText: smartImportText }));
        setShowAIImportModal(false);
        setSmartImportText('');
    };

    const consentFileInputRef = useRef<HTMLInputElement>(null);
    const screenerFileInputRef = useRef<HTMLInputElement>(null);
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

    const handleScreenerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFormData({ ...formData, screenerFile: file });
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
        localStorage.setItem(`study_launch_draft_${formData.protocol_id || 'new'}`, JSON.stringify({ currentStep, formData: serializableData }));
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
            const questionnaireDetails = Array.isArray(initialData.study_questionnaires)
                ? initialData.study_questionnaires.map((q: any) => q.template_details).filter(Boolean)
                : [];
            const questionnaireFrequencies = Array.isArray(initialData.study_questionnaires)
                ? initialData.study_questionnaires.reduce((acc: any, q: any) => {
                      const id = q.template || q.template_details?.id;
                      if (id) acc[id] = q.frequency || 'One time only';
                      return acc;
                  }, {})
                : {};
            const screenerQuestions = initialData.screener_config?.questions || 
                                     initialData.screener_config?.steps?.find((step: any) => step.type === 'user_input')?.questions || [];

            setFormData(prev => ({
                ...prev,
                protocol_id: initialData.protocol_id || prev.protocol_id,
                sponsor: initialData.sponsor_org_id || initialData.sponsor_org?.id || initialData.sponsor_name || '',
                startDate: initialData.start_date || '',
                endDate: initialData.end_date || '',
                full_title: initialData.full_title || initialData.title || '',
                title: initialData.title || '',
                category: initialData.condition || initialData.primary_indication || '',
                briefSummary: initialData.description || '',
                overview: initialData.overview || '',
                benefit: initialData.benefit || '',
                participation_message: initialData.participation_message || '',
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
                questionnaireDetails,
                questionnaireFrequencies,
                extractedConsentText: initialData.consent_content || initialData.consent_template || initialData.extracted_consent_text || '',
                countries: initialData.countries || []
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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
                                            flex-1 py-3 px-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-0.5
                                            ${isActive
                                                ? 'bg-blue-600/20 text-blue-400 font-black relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-blue-500'
                                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}
                                            ${!isLast ? 'border-r border-white/5' : ''}
                                        `}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Step {step.id}</span>
                                        <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`w-full max-w-5xl mx-auto bg-[#0F172A] rounded-xl p-3 md:p-4 border border-white/10 shadow-2xl min-h-[450px] transition-all ${!isEditMode ? 'opacity-80 grayscale-[0.3]' : ''}`}>
                        <fieldset disabled={!isEditMode} className="contents">
                {currentStep === 1 ? (
                    <div className="space-y-4">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white tracking-tight">Protocol fundamentals</h2>
                            <p className="text-slate-400 mt-0.5 text-xs md:text-sm">Define the core identifiers for this study before proceeding.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">BASIC IDENTIFIERS</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Internal Study ID */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Internal study ID</label>
                                    <input
                                        type="text"
                                        name="protocol_id"
                                        value={formData.protocol_id}
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

                                {/* Participating Countries */}
                                <div className="md:col-span-2">
                                    <CountrySelector 
                                        selectedCountries={formData.countries}
                                        onChange={(countries) => setFormData(prev => ({ ...prev, countries }))}
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
                                        name="full_title"
                                        value={formData.full_title}
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
                                            name="title"
                                            value={formData.title}
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
                                    <BulletTextarea
                                        name="briefSummary"
                                        value={formData.briefSummary}
                                        mode={formData.textModes.briefSummary as 'bullet' | 'plain' || 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const currentMode = prev.textModes.briefSummary || 'plain';
                                            const newMode = currentMode === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.briefSummary) : addBulletsToText(prev.briefSummary);
                                            return { 
                                                ...prev, 
                                                briefSummary: newValue,
                                                textModes: { ...prev.textModes, briefSummary: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, briefSummary: val }))}
                                        placeholder="e.g. Are you feeling gassy and bloated? You may qualify for this study."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">
                                        Study overview
                                    </label>
                                    <BulletTextarea
                                        name="overview"
                                        value={formData.overview}
                                        mode={formData.textModes.overview as 'bullet' | 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const newMode = prev.textModes.overview === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.overview) : addBulletsToText(prev.overview);
                                            return { 
                                                ...prev, 
                                                overview: newValue,
                                                textModes: { ...prev.textModes, overview: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, overview: val }))}
                                        placeholder="Describe the study..."
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">
                                        Benefits for participants
                                    </label>
                                    <BulletTextarea
                                        name="benefit"
                                        value={formData.benefit}
                                        mode={formData.textModes.benefit as 'bullet' | 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const newMode = prev.textModes.benefit === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.benefit) : addBulletsToText(prev.benefit);
                                            return { 
                                                ...prev, 
                                                benefit: newValue,
                                                textModes: { ...prev.textModes, benefit: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, benefit: val }))}
                                        placeholder="List participant benefits..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">
                                        Community participation message
                                    </label>
                                    <BulletTextarea
                                        name="participation_message"
                                        value={formData.participation_message}
                                        mode={formData.textModes.participation_message as 'bullet' | 'plain'}
                                        onModeToggle={() => setFormData(prev => {
                                            const newMode = prev.textModes.participation_message === 'bullet' ? 'plain' : 'bullet';
                                            const newValue = newMode === 'plain' ? stripBulletsFromText(prev.participation_message) : addBulletsToText(prev.participation_message);
                                            return { 
                                                ...prev, 
                                                participation_message: newValue,
                                                textModes: { ...prev.textModes, participation_message: newMode }
                                            };
                                        })}
                                        onChange={(val) => setFormData(prev => ({ ...prev, participation_message: val }))}
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
                                    <label className="text-sm font-medium text-[#e0e0e0]">Currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency || 'USD'}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="JPY">JPY (¥)</option>
                                        <option value="CAD">CAD (CA$)</option>
                                        <option value="AUD">AUD (A$)</option>
                                        <option value="CNY">CNY (¥)</option>
                                        <option value="CHF">CHF</option>
                                        <option value="SEK">SEK (kr)</option>
                                        <option value="SGD">SGD (S$)</option>
                                        <option value="AED">AED</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#e0e0e0]">Stipend amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">
                                            {getCurrencySymbol(formData.currency || 'USD')}
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
                                            <BulletTextarea
                                                name="studyKitDetails"
                                                value={formData.studyKitDetails}
                                                mode={formData.textModes.studyKitDetails as 'bullet' | 'plain' || 'plain'}
                                                onModeToggle={() => setFormData(prev => {
                                                    const currentMode = prev.textModes.studyKitDetails || 'plain';
                                                    const newMode = currentMode === 'bullet' ? 'plain' : 'bullet';
                                                    const newValue = newMode === 'plain' ? stripBulletsFromText(prev.studyKitDetails) : addBulletsToText(prev.studyKitDetails);
                                                    return { 
                                                        ...prev, 
                                                        studyKitDetails: newValue,
                                                        textModes: { ...prev.textModes, studyKitDetails: newMode }
                                                    };
                                                })}
                                                onChange={(val) => setFormData(prev => ({ ...prev, studyKitDetails: val }))}
                                                placeholder="Enter components and instructions for the study kit..."
                                                rows={3}
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
                                Continue to team management <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>

                ) : currentStep === 4 ? (
                    <div className="space-y-4">
                        <div className="mb-4 px-4 md:px-0">
                            <h2 className="text-xl font-bold text-white tracking-tight">Research team</h2>
                            <p className="text-slate-400 mt-0.5 text-xs md:text-sm">Select or invite the personnel assigned to this study. They will be notified upon launch.</p>
                        </div>

                        <div className="space-y-3 max-w-3xl px-2 md:px-0">
                            {/* PRINCIPAL INVESTIGATOR(S) CARD */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-3">PRINCIPAL INVESTIGATOR(S)</h3>
                                
                                <div className="space-y-2">
                                    {resolvedPIs.map((pi: any) => (
                                        <div key={pi.id} className="flex items-center justify-between pb-1.5 border-b border-white/5 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                    {(pi.first_name?.[0] || '') + (pi.last_name?.[0] || pi.email?.[0] || 'P')}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-bold text-white truncate">{pi.first_name || 'Unnamed'} {pi.last_name || ''}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">PI</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 truncate">{pi.organization || 'MusB Research Institute'}</span>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={(formData.selectedPIs as string[]).includes(pi.id)}
                                                onChange={() => handleArrayToggle('selectedPIs', pi.id)}
                                                className="w-5 h-5 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500/50 transition-all cursor-pointer shrink-0 ml-4"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">First Name</label>
                                            <input
                                                type="text"
                                                name="invitePIFirstName"
                                                value={formData.invitePIFirstName}
                                                onChange={(e) => setFormData({...formData, invitePIFirstName: e.target.value})}
                                                placeholder="e.g. John"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Last Name</label>
                                            <input
                                                type="text"
                                                name="invitePILastName"
                                                value={formData.invitePILastName}
                                                onChange={(e) => setFormData({...formData, invitePILastName: e.target.value})}
                                                placeholder="e.g. Smith"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-end gap-4">
                                        <div className="flex-1 w-full space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Email Address</label>
                                            <input
                                                type="email"
                                                name="invitePIEmail"
                                                value={formData.invitePIEmail}
                                                onChange={(e) => setFormData({...formData, invitePIEmail: e.target.value})}
                                                placeholder="pi@institution.edu"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleInvitePI} 
                                            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-blue-400 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-blue-500/20 transition-all whitespace-nowrap h-[46px] flex items-center justify-center"
                                        >
                                            SEND INVITE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CLINICAL COORDINATORS CARD */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-3">CLINICAL COORDINATORS</h3>
                                
                                <div className="space-y-4">
                                    {resolvedCoordinators.map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {(c.first_name?.[0] || '') + (c.last_name?.[0] || c.email?.[0] || 'C')}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-bold text-white truncate">{c.first_name || 'Unnamed'} {c.last_name || ''}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Coordinator</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 truncate">{c.organization || 'MusB Research Institute'}</span>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={(formData.selectedCoordinators as string[]).includes(c.id)}
                                                onChange={() => handleArrayToggle('selectedCoordinators', c.id)}
                                                className="w-5 h-5 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/50 transition-all cursor-pointer shrink-0 ml-4"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">First Name</label>
                                            <input
                                                type="text"
                                                name="inviteCoordinatorFirstName"
                                                value={formData.inviteCoordinatorFirstName}
                                                onChange={(e) => setFormData({...formData, inviteCoordinatorFirstName: e.target.value})}
                                                placeholder="e.g. Jane"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Last Name</label>
                                            <input
                                                type="text"
                                                name="inviteCoordinatorLastName"
                                                value={formData.inviteCoordinatorLastName}
                                                onChange={(e) => setFormData({...formData, inviteCoordinatorLastName: e.target.value})}
                                                placeholder="e.g. Doe"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-end gap-4">
                                        <div className="flex-1 w-full space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Email Address</label>
                                            <input
                                                type="email"
                                                name="inviteCoordinatorEmail"
                                                value={formData.inviteCoordinatorEmail}
                                                onChange={(e) => setFormData({...formData, inviteCoordinatorEmail: e.target.value})}
                                                placeholder="coordinator@clinic.org"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleInviteCoordinator} 
                                            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-emerald-400 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-emerald-500/20 transition-all whitespace-nowrap h-[46px] flex items-center justify-center"
                                        >
                                            SEND INVITE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SPONSOR PERSONNEL CARD */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">SPONSOR PERSONNEL</h3>
                                
                                <div className="space-y-4">
                                    {resolvedSponsorUsers.map((s: any) => (
                                        <div key={s.id} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {(s.first_name?.[0] || '') + (s.last_name?.[0] || s.email?.[0] || 'S')}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-bold text-white truncate">{s.first_name || 'Unnamed'} {s.last_name || ''}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Sponsor</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 truncate">{s.organization || 'NovaBiotics Inc.'}</span>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={(formData.selectedSponsorUsers as string[]).includes(s.id)}
                                                onChange={() => handleArrayToggle('selectedSponsorUsers', s.id)}
                                                className="w-5 h-5 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500/50 transition-all cursor-pointer shrink-0 ml-4"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">First Name</label>
                                            <input
                                                type="text"
                                                name="inviteSponsorFirstName"
                                                value={formData.inviteSponsorFirstName}
                                                onChange={(e) => setFormData({...formData, inviteSponsorFirstName: e.target.value})}
                                                placeholder="e.g. Alice"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Last Name</label>
                                            <input
                                                type="text"
                                                name="inviteSponsorLastName"
                                                value={formData.inviteSponsorLastName}
                                                onChange={(e) => setFormData({...formData, inviteSponsorLastName: e.target.value})}
                                                placeholder="e.g. Johnson"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-end gap-4">
                                        <div className="flex-1 w-full space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Email Address</label>
                                            <input
                                                type="email"
                                                name="inviteSponsorEmail"
                                                value={formData.inviteSponsorEmail}
                                                onChange={(e) => setFormData({...formData, inviteSponsorEmail: e.target.value})}
                                                placeholder="sponsor@pharma.com"
                                                autoComplete="new-password"
                                                className="w-full bg-[#0B101B] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleInviteSponsor} 
                                            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-amber-400 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-amber-500/20 transition-all whitespace-nowrap h-[46px] flex items-center justify-center"
                                        >
                                            SEND INVITE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-500 px-4 md:px-0 pt-4 font-medium italic">Selected personnel will be automatically assigned to this study upon launch and will receive portal access.</p>

                        {/* Footer Navigation for Step 4 (Team) */}
                        <div className="pt-8 px-0 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl border-t border-white/5">
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="w-full sm:w-[160px] py-4 rounded-xl font-bold bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                            >
                                <span className="text-sm">&larr;</span> Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-full sm:flex-1 py-4 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                            >
                                Continue to screening form <span className="text-sm">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 5 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Participant screening</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Build the qualification questionnaire for potential participants.</p>
                        </div>

                        {/* SCREENER DOCUMENT REMOVED FROM HERE - MOVED TO STEP 7 FOR CENTRALIZED DOC MGMT */}

                        <ScreenerBuilder
                            initialQuestions={formData.screenerQuestions}
                            onSave={(questions: any[]) => setFormData(prev => ({ ...prev, screenerQuestions: questions }))}
                            standalone={true}
                        />

                        {/* Footer Navigation for Step 5 (Screening) */}
                        <div className="pt-4 flex items-center justify-between gap-4">
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
                                Continue to questionnaire builder <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 6 ? (
                    <div className="space-y-4">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white tracking-tight">Study questionnaires</h2>
                            <p className="text-slate-400 mt-0.5 text-xs md:text-sm">Select or create follow-up questionnaires for enrolled participants.</p>
                        </div>

                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">SELECTED QUESTIONNAIRES</div>
                            
                            <div className="space-y-4">
                                {formData.questionnaireDetails.map((q: any) => (
                                    <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/5 last:border-0">
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white mb-1">{q.name}</div>
                                            <div className="text-[11px] text-slate-400 leading-relaxed">
                                                {q.json_structure?.instructions ? q.json_structure.instructions.substring(0, 100) + '...' : 'Participant-reported outcome'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="relative">
                                                <select
                                                    value={formData.questionnaireFrequencies[q.id] || 'One time only'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, questionnaireFrequencies: { ...prev.questionnaireFrequencies, [q.id]: e.target.value } }))}
                                                    className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-blue-500 transition-colors w-40 cursor-pointer"
                                                >
                                                    <option value="One time only">One time only</option>
                                                    <option value="Baseline only">Baseline only</option>
                                                    <option value="Each visit">Each visit</option>
                                                    <option value="Daily">Daily</option>
                                                    <option value="3x per day">3x per day</option>
                                                    <option value="Alternate days">Alternate days</option>
                                                    <option value="Weekly">Weekly</option>
                                                    <option value="Monthly">Monthly</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                            </div>
                                            <button className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors">
                                                Preview
                                            </button>
                                            <button onClick={() => {
                                                    const nextIds = formData.selectedQuestionnaires.filter((id: string) => id !== q.id);
                                                    const nextDetails = formData.questionnaireDetails.filter((d: any) => d.id !== q.id);
                                                    setFormData(prev => ({ ...prev, selectedQuestionnaires: nextIds, questionnaireDetails: nextDetails }));
                                                }} className="p-2 text-slate-500 hover:text-rose-500 transition-colors shrink-0">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.questionnaireDetails.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">
                                        No questionnaires selected.
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setIsQuestionnaireModalOpen(true)}
                                className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white tracking-widest uppercase hover:bg-white/10 transition-colors"
                            >
                                + Add from questionnaire repository
                            </button>
                        </div>

                        {/* Footer Navigation for Step 6 (Questionnaires) */}
                        <div className="pt-4 flex items-center justify-between gap-4">
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
                                Continue to documentation <span className="text-xl leading-none">&rarr;</span>
                            </button>
                        </div>
                    </div>
                ) : currentStep === 7 ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Study documents</h2>
                            <p className="text-slate-400 mt-1 text-sm md:text-base">Upload required documents. The consent form will appear in the participant portal for electronic signature if e-consent was selected.</p>
                        </div>

                        {/* SCREENER DOCUMENT (MOVED FROM STEP 5) */}
                        <div className="bg-[#0F172A]/40 border border-white/10 rounded-[2rem] p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">ELIGIBILITY SCREENER PROTOCOL</h3>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <FileText className="w-3 h-3 text-blue-500" />
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">SCREENING SOURCE</span>
                                </div>
                            </div>

                            <div 
                                onClick={() => screenerFileInputRef.current?.click()}
                                className="h-[180px] border-2 border-dashed border-blue-500/20 bg-black/40 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/40 transition-all group"
                            >
                                {formData.screenerFile ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-white uppercase italic tracking-tighter mb-1">{formData.screenerFile.name}</div>
                                            <div className="text-[10px] text-blue-500 uppercase font-black tracking-widest">PROTOCOL ATTACHED</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <Upload className="w-10 h-10 text-blue-500 transition-transform group-hover:-translate-y-1" />
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">UPLOAD SCREENER</div>
                                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] italic">ELIGIBILITY PROTOCOL</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={screenerFileInputRef}
                                onChange={handleScreenerFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                            />
                        </div>

                        {/* INFORMED CONSENT FORM CARD */}
                        <div className="bg-[#0F172A]/40 border border-white/10 rounded-[2rem] p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">INFORMED CONSENT FORM</h3>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 rounded-xl border border-pink-500/20">
                                    <Terminal className="w-3 h-3 text-pink-500" />
                                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">AI EXTRACT</span>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={consentFileInputRef}
                                onChange={handleConsentFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                            />

                            {!formData.extractedConsentText && (
                                <div
                                    onClick={() => consentFileInputRef.current?.click()}
                                    className={`relative h-[240px] border-2 border-dashed ${isExtracting ? 'border-pink-500 bg-pink-500/5' : 'border-pink-500/20 bg-black/40 hover:border-pink-500/40'} transition-all rounded-[2rem] flex flex-col items-center justify-center cursor-pointer text-center group`}
                                >
                                    {isExtracting ? (
                                        <>
                                            <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                                            <p className="text-pink-400 font-black uppercase tracking-[0.3em] text-[10px] italic">NEURAL SYNCHRONIZATION...</p>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <Upload className="w-10 h-10 text-pink-500 transition-transform group-hover:-translate-y-1" />
                                            <div>
                                                <div className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">UPLOAD DOC</div>
                                                <div className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.3em] italic">AI EXTRACTION</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.extractedConsentText && (
                                <div className="space-y-6">
                                    {/* FILE HEADER */}
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{formData.consentFormFile?.name || 'Consent Form.pdf'}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    {formData.consentFormFile ? (formData.consentFormFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setFormData({...formData, extractedConsentText: ''})} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* AI EXTRACTION REVIEW AREA */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="w-4 h-4 text-pink-500" />
                                            <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">AI EXTRACTION DOCUMENT REVIEW</h4>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-black/20 rounded-[2rem] border border-white/5 p-8 relative overflow-hidden">
                                            {/* LEFT: TEXT CONTENT */}
                                            <div className="lg:col-span-8 space-y-8 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
                                                <div className="font-mono text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                                                    {formData.extractedConsentText}
                                                </div>
                                            </div>

                                            {/* RIGHT: SIGNATURE OVERSIGHT PREVIEW */}
                                            <div className="lg:col-span-4">
                                                <div className="bg-[#0F172A] border border-pink-500/20 rounded-2xl p-6 space-y-6 sticky top-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="text-[9px] font-black text-white uppercase tracking-widest">OVERSIGHT SIGNATURES</h5>
                                                        <Shield className="w-3 h-3 text-pink-500" />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <SignaturePlaceholder label="01. PARTICIPANT" status="SIGNATURE REQUIRED" color="pink" />
                                                        <SignaturePlaceholder label="02. COORDINATOR" status="VERIFICATION REQUIRED" color="blue" />
                                                        <SignaturePlaceholder label="03. PRINCIPAL INV." status="FINAL APPROVAL" color="emerald" />
                                                    </div>

                                                    <div className="pt-4 border-t border-white/5">
                                                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Blockchain Hash</div>
                                                        <div className="text-[10px] font-mono text-pink-500/50 truncate">0x71C22...F6B1</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* VALIDATION BUTTONS */}
                                        <div className="flex items-center justify-between pt-4">
                                            <div className="flex gap-3">
                                                <button className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ITS VALIDATED
                                                </button>
                                                <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-black text-red-400 uppercase tracking-widest">
                                                    NOT VALIDATED
                                                </button>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setCurrentStep(8)}
                                                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-[11px] font-black text-white uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] transition-all"
                                            >
                                                DATA SYNCHRONIZED
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ADDITIONAL DOCUMENTS CARD */}
                        <div className="bg-[#0F172A]/40 border border-white/10 rounded-[2rem] p-8 space-y-8">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">ADDITIONAL STUDY DOCUMENTS</h3>
                            
                            <div className="h-[180px] border-2 border-dashed border-white/5 bg-black/40 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-white/10 transition-all">
                                <Upload className="w-6 h-6 text-slate-600 mb-4" />
                                <p className="text-sm font-bold text-white tracking-tight">Upload protocol, IRB approval, or other documents</p>
                            </div>
                        </div>

                        {/* Footer Navigation for Step 7 (Documents) */}
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
                    <div className="space-y-12">
                        {/* THE NEW REVIEW PAGE - REDESIGNED TO MATCH SCREENSHOT 2 */}
                        <div className="flex flex-col gap-10">
                            <div className="mb-6">
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Review & Launch</h2>
                                <p className="text-slate-500 mt-2 text-sm font-medium">
                                    Review your study configuration before submitting. <span className="text-blue-400">Missing fields are highlighted below.</span>
                                </p>
                            </div>

                            {/* CONFIGURATION SUMMARY TABLES */}
                            <div className="grid grid-cols-1 gap-8">
                                {/* 1. PROTOCOL SECTION */}
                                <div className="bg-[#0B101B]/60 border border-white/10 rounded-[2rem] overflow-hidden">
                                    <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                        <Terminal className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Protocol</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        <ReviewRow label="Internal ID" value={formData.protocol_id} placeholder="Required" isCritical={!formData.protocol_id} />
                                        <ReviewRow label="Sponsor" value={getSponsorDisplayName(formData.sponsor)} placeholder="Not selected" isCritical={!formData.sponsor} />
                                        <ReviewRow label="Start Date" value={formData.startDate} placeholder="Not set" />
                                        <ReviewRow label="End Date" value={formData.endDate} placeholder="Not set" />
                                        <ReviewRow label="Countries" value={formData.countries.join(', ')} placeholder="Global Study" />
                                    </div>
                                </div>

                                {/* 2. STUDY INFORMATION SECTION */}
                                <div className="bg-[#0B101B]/60 border border-white/10 rounded-[2rem] overflow-hidden">
                                    <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                        <Info className="w-4 h-4 text-emerald-400" />
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Study Information</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        <ReviewRow label="Category" value={formData.category} placeholder="Not selected" />
                                        <ReviewRow label="Brief summary" value={formData.briefSummary} placeholder="No summary provided" truncate />
                                        <ReviewRow label="Public short title" value={formData.title} placeholder="Required" isCritical={!formData.title} />
                                        <ReviewRow label="Official full title" value={formData.full_title} placeholder="Required" isCritical={!formData.full_title} />
                                    </div>
                                </div>

                                {/* 3. TEAM & DESIGN SECTION */}
                                <div className="bg-[#0B101B]/60 border border-white/10 rounded-[2rem] overflow-hidden">
                                    <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                        <Layout className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Team & Design</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        <ReviewRow 
                                            label="PI assigned" 
                                            value={[
                                                ...resolvedPIs.filter((pi: any) => formData.selectedPIs.includes(pi.id) || formData.selectedPIs.includes(pi.email)).map((pi: any) => `${pi.first_name} ${pi.last_name}`),
                                                ...formData.selectedPIs.filter((idOrEmail: string) => !resolvedPIs.some(p => p.id === idOrEmail || p.email === idOrEmail))
                                            ].join(', ')} 
                                            placeholder="No PI selected" 
                                            isCritical={formData.selectedPIs.length === 0}
                                        />
                                        <ReviewRow 
                                            label="Coordinator assigned" 
                                            value={[
                                                ...resolvedCoordinators.filter((c: any) => formData.selectedCoordinators.includes(c.id) || formData.selectedCoordinators.includes(c.email)).map((c: any) => `${c.first_name} ${c.last_name}`),
                                                ...formData.selectedCoordinators.filter((idOrEmail: string) => !resolvedCoordinators.some(p => p.id === idOrEmail || p.email === idOrEmail))
                                            ].join(', ')} 
                                            placeholder="No Coordinator selected" 
                                            isCritical={formData.selectedCoordinators.length === 0}
                                        />
                                        <ReviewRow label="Trial phase" value={phaseToLabel[formData.clinicalPhase] || formData.clinicalPhase} />
                                        <ReviewRow label="Masking" value={maskingToLabel[formData.maskingStrategy] || formData.maskingStrategy} />
                                        <ReviewRow label="Execution" value={studyTypeToLabel[formData.executionMode] || formData.executionMode} />
                                        <ReviewRow label="Reward" value={rewardTypeToLabel[formData.rewardType] || formData.rewardType} />
                                        <ReviewRow label="Incentive" value={rewardLogicToLabel[formData.incentiveLogic] || formData.incentiveLogic} />
                                        <ReviewRow label="Target Enrollment" value={formData.targetEnrollment?.toString()} placeholder="0" />
                                    </div>
                                </div>
                            </div>

                            {/* 4. SCREENER & INSTRUMENTS SECTION */}
                            <div className="bg-[#0B101B]/60 border border-white/10 rounded-[2rem] overflow-hidden">
                                <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Screener & Instruments</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    <ReviewRow 
                                        label="Eligibility Screener" 
                                        value={formData.screenerQuestions.length > 0 ? `${formData.screenerQuestions.length} Questions Configured` : ''} 
                                        placeholder="Not Configured" 
                                        isCritical={formData.screenerQuestions.length === 0}
                                    />
                                    <ReviewRow 
                                        label="Clinical Instruments" 
                                        value={formData.selectedQuestionnaires.length > 0 ? `${formData.selectedQuestionnaires.length} Templates Selected` : ''} 
                                        placeholder="None Selected" 
                                    />
                                </div>
                            </div>

                            {/* 5. DOCUMENTATION SECTION */}
                            <div className="bg-[#0B101B]/60 border border-white/10 rounded-[2rem] overflow-hidden">
                                <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Documentation</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    <ReviewRow 
                                        label="Informed Consent" 
                                        value={formData.extractedConsentText ? 'AI-Extracted Content Provided' : (formData.consentFormFile ? 'PDF Template Provided' : '')} 
                                        placeholder="No document provided" 
                                        isCritical={!formData.extractedConsentText && !formData.consentFormFile}
                                    />
                                    <ReviewRow 
                                        label="Additional Docs" 
                                        value={formData.additionalDocuments.length > 0 ? `${formData.additionalDocuments.length} files attached` : ''} 
                                        placeholder="None"
                                    />
                                </div>
                            </div>

                            {/* Footer Navigation */}
                            <div className="pt-12 flex items-center justify-between gap-4 border-t border-white/10">
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
                                        const documentsToUpload = [];
                                        if (formData.consentFormFile) {
                                            documentsToUpload.push({
                                                file: formData.consentFormFile,
                                                name: 'Consent Form - ' + formData.title,
                                                category: 'CONSENT',
                                                version: 'V1.0'
                                            });
                                        }
                                        if (formData.screenerFile) {
                                            documentsToUpload.push({
                                                file: formData.screenerFile,
                                                name: 'Screener Form - ' + formData.title,
                                                category: 'SCREENER',
                                                version: 'V1.0'
                                            });
                                        }
                                        if (formData.additionalDocuments && formData.additionalDocuments.length > 0) {
                                            formData.additionalDocuments.forEach((file: File) => {
                                                documentsToUpload.push({
                                                    file: file,
                                                    name: file.name,
                                                    category: 'OTHER',
                                                    version: 'V1.0'
                                                });
                                            });
                                        }
                                        await onSave(formData, documentsToUpload);
                                    } catch (err: any) {
                                        console.error("Launch error:", err);
                                        const errorMsg = err.message || JSON.stringify(err);
                                        if (errorMsg.includes('protocol_id') && errorMsg.includes('exists')) {
                                            alert("CRITICAL ERROR: A study with this Protocol ID already exists. Please return to Step 1 and provide a unique ID (e.g., MUSB-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000) + ").");
                                        } else {
                                            alert("LAUNCH FAILED: " + errorMsg);
                                        }
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting || !isEditMode}
                                className="w-1/4 py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-white text-slate-900 hover:bg-blue-400 hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-2xl shadow-white/10"
                            >
                                {isSubmitting 
                                    ? (initialData ? 'SAVING...' : 'LAUNCHING...') 
                                    : (initialData ? (isEditMode ? 'SAVE CHANGES' : 'LOCKED') : 'CONFIRM & LAUNCH')}
                            </button>
                        </div>
                        </div>
                    </div>
                ) : null}
                </fieldset>
                </div>
                </div>

                {/* Live Summary Sidebar - Fulfilling "show all details when we start filling" */}
                <div className="w-full lg:w-72 2xl:w-80 shrink-0 order-1 lg:order-2 lg:sticky lg:top-4">
                    <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 shadow-2xl space-y-5">
                        <div>
                            <div className="text-[9px] font-black text-blue-400 tracking-[0.3em] uppercase mb-3">Live Study Summary</div>
                            
                            {/* Key Identity */}
                            <div className="space-y-2.5">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Protocol Identification</div>
                                    <div className="text-[13px] font-black text-white italic truncate">{formData.protocol_id || 'PENDING ID'}</div>
                                    <div className="text-[10px] font-bold text-blue-400 mt-0.5 truncate">{formData.title || 'UNTITLED STUDY'}</div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Sponsor Entity</div>
                                    <div className="text-[12px] font-bold text-white truncate flex items-center gap-2">
                                        <Building2 size={12} className="text-slate-500" />
                                        {formData.sponsor ? getSponsorDisplayName(formData.sponsor) : <span className="text-slate-600 italic">None selected</span>}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Timeline</div>
                                    <div className="text-[11px] font-bold text-white flex items-center gap-2">
                                        <Calendar size={12} className="text-slate-500" />
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
                        <div className="p-3 bg-blue-600/5 border border-blue-500/20 rounded-xl">
                            <div className="flex gap-2.5">
                                <Sparkles size={14} className="text-blue-400 shrink-0" />
                                <div>
                                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">PRO TIP</div>
                                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">Study identifiers like Internal ID are required for billing and IRB tracking. Ensure accuracy before launch.</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveDraft} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Upload size={12} className="text-slate-400" />
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

            <AnimatePresence>
                {isQuestionnaireModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#060B16]/90 backdrop-blur-md z-[200] overflow-y-auto"
                    >
                        <div className="min-h-screen p-4 flex flex-col">
                            <div className="flex justify-end p-4">
                                <button onClick={() => setIsQuestionnaireModalOpen(false)} className="p-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 bg-[#0B101B] rounded-3xl border border-white/10 p-6 md:p-10 mx-auto w-full max-w-7xl mb-8">
                                <QuestionnaireBuilder
                                    selectedIds={formData.selectedQuestionnaires}
                                    onChange={(ids, templates) => {
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            selectedQuestionnaires: ids,
                                            questionnaireDetails: templates || prev.questionnaireDetails
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LaunchStudyForm;