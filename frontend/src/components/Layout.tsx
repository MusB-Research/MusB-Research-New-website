import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Linkedin, Mail, MapPin, Phone, ChevronDown, Youtube, Facebook, Instagram, Send, Loader2, CheckCircle2, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { redirectToLogin, clearToken, isLoggedIn, getRole } from '../utils/auth';


interface LayoutProps {
    children: ReactNode;
}

interface NavItem {
    path: string;
    label: string;
    children?: { path: string; label: string }[];
}

export default function Layout({ children }: LayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const location = useLocation();

    // Newsletter State
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState<'Business' | 'Individual'>('Individual');
    const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubscribe = async () => {
        if (!email) return;
        setNewsletterStatus('loading');
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setNewsletterStatus('success');
            setEmail('');
        } catch (err) {
            console.error(err);
            setNewsletterStatus('error');
        }
    };

    const globalNavItems: NavItem[] = [
        { path: '/support', label: 'For Businesses' },
        { path: '/trials', label: 'For Patients' },
        {
            path: '#',
            label: 'About Us',
            children: [
                { path: '/why-choose-us', label: 'Why Choose MusB Research' },
                { path: '/capabilities', label: 'Capabilities' },
                { path: '/facilities', label: 'Facilities' },
                { path: '/team', label: 'Our Team' },
                { path: '/trials', label: 'Find a Study' },
            ]
        },
        { path: '/innovations', label: 'Innovation' },
        { path: '/news', label: 'News & Events' },
        { path: '/careers', label: 'Careers' },
        { path: '/contact', label: 'Contact Us' },
    ];

    const trialsNavItems: NavItem[] = [
        { path: '/trials#join', label: 'Join a Study' },
        { path: '/trials#how-it-works', label: 'How It Works' },
        { path: '/trials#current-studies', label: 'Current Studies' },
        { path: '/trials#faq', label: 'FAQ' },
        { path: '/team', label: 'Our Team' },
        { path: '/contact', label: 'Contact' },
    ];

    const isTrialsPage = location.pathname === '/trials';
    const navItems = isTrialsPage ? trialsNavItems : globalNavItems;

    // Handle hash scrolling
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
                }, 100);
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location]);

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-100 relative">
            {/* Animated Mesh Background */}


            {/* Sticky Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass-nav h-20 md:h-24 transition-all duration-500">
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 2xl:px-12 h-full flex items-center justify-between gap-4 xl:gap-8">
                    {/* Logo - Acts as Home button opening in new tab */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-4 group"
                    >
                        <div className="h-12 md:h-16 bg-white/10 backdrop-blur-md px-4 md:px-5 py-2 md:py-2.5 rounded-2xl shadow-2xl border border-white/20 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                            <img src="/logo.jpg" alt="MusB™ Research" className="h-full w-auto object-contain brightness-110 contrast-125 rounded-lg" />
                        </div>
                    </a>

                    {/* Right-aligned Navigation Group */}
                    <div className="hidden xl:flex items-center gap-4 2xl:gap-12 ml-auto">
                        {/* Desktop Navigation */}
                        <nav className="flex items-center gap-3 2xl:gap-8">
                            {navItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative group/nav"
                                    onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    {item.path === '#' ? (
                                        <div
                                            className="text-[11px] font-black tracking-[0.12em] uppercase transition-all hover:text-cyan-600 flex items-center gap-1 2xl:gap-1.5 py-8 cursor-pointer text-slate-800 whitespace-nowrap"
                                        >
                                            {item.label}
                                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                            <span className={`absolute bottom-6 left-0 w-full h-0.5 bg-cyan-600 transform origin-left transition-transform duration-300 ${openDropdown === item.label ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`}></span>
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            className={`text-[11px] font-black tracking-[0.12em] uppercase transition-all hover:text-cyan-600 flex items-center gap-1 2xl:gap-1.5 py-8 whitespace-nowrap ${location.pathname === item.path ? 'text-cyan-600' : 'text-slate-800'
                                                }`}
                                        >
                                            {item.label}
                                            {item.children && <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />}
                                            <span className={`absolute bottom-6 left-0 w-full h-0.5 bg-cyan-600 transform origin-left transition-transform duration-300 ${location.pathname === item.path ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`}></span>
                                        </Link>
                                    )}

                                    {/* Dropdown Menu */}
                                    {item.children && (
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-2 transition-all duration-300 transform origin-top ${openDropdown === item.label ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                                            }`}>
                                            <div className="space-y-1">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.path + child.label}
                                                        to={child.path}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className="block px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 hover:text-cyan-600 transition-all"
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-2 2xl:gap-4">
                            {isTrialsPage ? (
                                <>
                                    <Link
                                        to="/trials#current-studies"
                                        className="bg-cyan-500 text-slate-900 px-4 2xl:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-white hover:-translate-y-0.5 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                    >
                                        Check Eligibility
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <a
                                        href="tel:+18134190781"
                                        className="border-2 border-slate-900 text-slate-900 px-4 2xl:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-950 hover:text-white transition-all backdrop-blur-md whitespace-nowrap"
                                    >
                                        Call / Text Us
                                    </a>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/trials"
                                        className="bg-cyan-500 text-slate-900 px-4 2xl:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-white hover:-translate-y-0.5 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                    >
                                        Join a Study
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>

                                </>
                            )}
                            {!isLoggedIn() ? (
                                <button
                                    onClick={redirectToLogin}
                                    className="bg-slate-900 text-white px-4 2xl:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-cyan-500 hover:text-slate-900 transition-all shadow-xl flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </button>
                            ) : (
                                <>
                                    {getRole() === "SUPER_ADMIN" && (
                                        <Link
                                            to="/dashboard/super-admin"
                                            className="bg-cyan-500 text-slate-900 px-4 2xl:px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-white transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </Link>
                                    )}
                                    {getRole() === "ADMIN" && (
                                        <Link
                                            to="/dashboard/admin"
                                            className="bg-cyan-500 text-slate-900 px-4 2xl:px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-white transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Admin Portal
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => { clearToken(); window.location.href = "/"; }}
                                        className="border-2 border-slate-900 text-slate-900 px-4 2xl:px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-950 hover:text-white transition-all backdrop-blur-md flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="xl:hidden p-2 md:p-3 text-slate-800 hover:text-cyan-600 bg-slate-900/5 rounded-lg border border-slate-900/10"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="xl:hidden absolute top-20 md:top-24 left-4 right-4 md:left-6 md:right-6 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-4 z-40 overflow-hidden border border-slate-200 max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-8rem)] overflow-y-auto">
                        <div className="p-4 space-y-2">
                            {navItems.map((item) => (
                                <div key={item.label}>
                                    {item.children ? (
                                        <div className="space-y-1">
                                            <div className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 mt-4 first:mt-0">
                                                {item.label}
                                            </div>
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.path + child.label}
                                                    to={child.path}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={`block p-4 rounded-xl text-base font-bold uppercase tracking-widest border border-transparent ${location.pathname === child.path
                                                        ? 'bg-slate-100 text-cyan-600 border-slate-200'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`block p-4 rounded-xl text-base font-bold uppercase tracking-widest border border-transparent ${location.pathname === item.path
                                                ? 'bg-slate-100 text-cyan-600 border-slate-200'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                            <div className="pt-6 space-y-3">
                                {isTrialsPage ? (
                                    <>
                                        <a
                                            href="tel:+18134190781"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block w-full text-center border-2 border-slate-900 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all"
                                        >
                                            Call / Text Us
                                        </a>
                                        <Link
                                            to="/trials#current-studies"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block w-full text-center bg-cyan-500 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                                        >
                                            Check Eligibility
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </>
                                ) : (
                                    <>

                                        <Link
                                            to="/trials"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block w-full text-center bg-cyan-500 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                                        >
                                            Join Study
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </>
                                )}
                                {!isLoggedIn() ? (
                                    <button
                                        onClick={redirectToLogin}
                                        className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Sign In
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        {getRole() === "SUPER_ADMIN" && (
                                            <Link
                                                to="/dashboard/super-admin"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block w-full text-center bg-cyan-500 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <LayoutDashboard className="w-5 h-5" />
                                                Dashboard
                                            </Link>
                                        )}
                                        {getRole() === "ADMIN" && (
                                            <Link
                                                to="/dashboard/admin"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block w-full text-center bg-cyan-500 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <LayoutDashboard className="w-5 h-5" />
                                                Admin Portal
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => { clearToken(); window.location.href = "/"; }}
                                            className="w-full text-center border-2 border-slate-900 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow w-full">
                {children}
            </main>

            {/* Footer Section */}
            <footer className="pt-12 md:pt-20 bg-slate-950/40 border-t border-white/5">
                <div className="max-w-[1700px] mx-auto px-6 md:px-12 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-16 md:mb-24">
                        {/* Left Column: Branding & Contact */}
                        <div className="lg:col-span-4 space-y-8 md:space-y-10">
                            <Link to="/" className="inline-block group">
                                <div className="h-16 md:h-20 bg-white/10 backdrop-blur-md px-4 md:px-5 py-2 md:py-2.5 rounded-2xl shadow-2xl border border-white/20 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                                    <img src="/logo.jpg" alt="MusB™ Research" className="h-full w-auto object-contain brightness-110 contrast-125" />
                                </div>
                            </Link>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <p className="text-slate-400 text-base font-medium leading-relaxed pt-2">
                                        6331 State Road 54<br />New Port Richey, FL 34653
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <p className="text-slate-400 text-base font-bold group-hover:text-cyan-400 transition-colors">+1-813-419-0781</p>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <p className="text-slate-400 text-base font-bold group-hover:text-cyan-400 transition-colors">info@musbresearch.com</p>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column: Links & Social */}
                        <div className="md:col-span-2 lg:col-span-4 space-y-12 md:space-y-16">
                            <div className="grid grid-cols-2 gap-8 text-left">
                                <div className="space-y-6 md:space-y-8">
                                    <h4 className="text-white font-black uppercase tracking-[0.2em] text-[13px]">Solutions</h4>
                                    <ul className="space-y-4">
                                        {[
                                            { label: 'For Businesses', path: '/support' },
                                            { label: 'For Patients', path: '/trials' },
                                            { label: 'Innovation', path: '/innovations' },
                                            { label: 'Join a Study!', path: '/trials' }
                                        ].map((item) => (
                                            <li key={item.label}><Link to={item.path} className="text-slate-400 hover:text-cyan-400 text-[14px] md:text-[15px] transition-colors font-bold flex items-center justify-start gap-2 group">{item.label} <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-6 md:space-y-8">
                                    <h4 className="text-white font-black uppercase tracking-[0.2em] text-[12px] md:text-[13px]">MusB Group</h4>
                                    <ul className="space-y-4">
                                        {[
                                            { label: 'About Us', path: '/about' },
                                            { label: 'News & Events', path: '/news' },
                                            { label: 'Careers', path: '/careers' },
                                            { label: 'Contact Us', path: '/contact' }
                                        ].map((item) => (
                                            <li key={item.label}><Link to={item.path} className="text-slate-400 hover:text-cyan-400 text-[14px] md:text-[15px] transition-colors font-bold flex items-center justify-start gap-2 group">{item.label} <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
                                <h4 className="text-white font-black uppercase tracking-[0.2em] text-[13px]">Join the Community</h4>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                    {[
                                        { icon: Youtube, label: 'YouTube', url: 'https://youtube.com/@MusB-v5n' },
                                        { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61579407750169' },
                                        { icon: Instagram, label: 'Instagram', url: 'https://www.instagram.com/musbresearch/' },
                                        { icon: Linkedin, label: 'LinkedIn', url: 'https://www.linkedin.com/company/musb-res/' },
                                        {
                                            icon: (props: any) => (
                                                <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                            ),
                                            label: 'WhatsApp',
                                            url: 'https://wa.me/17275050452'
                                        }
                                    ].map((social) => (
                                        <a
                                            key={social.label}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={social.label}
                                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-slate-900 hover:border-cyan-500 transition-all font-bold"
                                        >
                                            {(() => {
                                                const Icon = social.icon;
                                                return <Icon className="w-5 h-5" />;
                                            })()}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-4 space-y-12">
                            <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 blur-2xl"></div>
                                <h4 className="text-white font-black uppercase tracking-[0.2em] text-[12px] md:text-[13px]">Get Our Newsletters</h4>
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm font-medium">Which Best Describes You?</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => setUserType('Business')}
                                            className={`flex-1 px-4 py-2 rounded-lg text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all ${userType === 'Business' ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            Business
                                        </button>
                                        <button
                                            onClick={() => setUserType('Individual')}
                                            className={`flex-1 px-4 py-2 rounded-lg text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all ${userType === 'Individual' ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            Individual
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Your Email"
                                            disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-5 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleSubscribe}
                                            disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-900 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {newsletterStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : newsletterStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {newsletterStatus === 'success' && <p className="text-green-400 text-xs font-bold">Subscribed successfully!</p>}
                                    {newsletterStatus === 'error' && <p className="text-red-400 text-xs font-bold">Failed to subscribe. Please try again.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-8">
                        <div className="space-y-2 text-center lg:text-left">
                            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">© 2026 MusB™ Research. All Rights Reserved.</p>
                            <p className="text-[11px] text-slate-600 font-medium">Information can change without notice. MusB™ Research – Integrated Research & Clinical Solutions.</p>
                        </div>
                        <div className="flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <Link to="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
                            <Link to="#" className="hover:text-cyan-400 transition-colors">Terms of Use</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
