import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Linkedin, Mail, MapPin, Phone, ChevronDown, Youtube, Facebook, Instagram, Send, Loader2, CheckCircle2, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react';
import { redirectToLogin, clearToken, isLoggedIn, getRole, getUser } from '../utils/auth';
import { subscribeNewsletter } from '../api';
import AnimatedBackground from './AnimatedBackground';

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

    // Authenticated User State
    const userRole = getRole();
    const userObj = getUser();
    const userName = userObj?.first_name
        ? userObj.first_name.trim().split(' ')[0]
        : (userObj?.name ? userObj.name.split(' ')[0] : (userObj?.email ? userObj.email.split('@')[0] : 'User'));

    const dashboardLink =
        userRole === 'SUPER_ADMIN' ? '/dashboard/super-admin'
            : userRole === 'ADMIN' ? '/dashboard/admin'
                : userRole === 'PARTICIPANT' ? '/dashboard/participant'
                    : (userRole === 'PI' || userRole === 'COORDINATOR' || userRole === 'ONSITE') ? '/dashboard/pi'
                        : userRole === 'SPONSOR' ? '/dashboard/sponsor'
                            : '/dashboard';

    const handleSubscribe = async () => {
        if (!email) return;
        setNewsletterStatus('loading');
        try {
            await subscribeNewsletter(email, userType);
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
                { path: '/team', label: 'Our Team' }
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
    ];

    const isTrialsPage = location.pathname === '/trials';
    const navItems = isTrialsPage ? trialsNavItems : globalNavItems;

    // Handle hash scrolling
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const scrollToElement = () => {
                const element = document.getElementById(id);
                if (element) {
                    const navbarOffset = 100; // Account for fixed navbar height
                    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - navbarOffset, behavior: 'smooth' });
                }
            };
            // Initial attempt after short delay
            setTimeout(scrollToElement, 100);
            // Retry for cross-page navigations where DOM may not be ready
            setTimeout(scrollToElement, 500);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location]);

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isDashboard = location.pathname.startsWith('/dashboard');
    if (isDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-100 relative">
            {/* Sticky Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-20 md:h-24 bg-white/95 backdrop-blur-md border-b border-slate-200">
                <div className="w-full h-full">
                    <nav className="h-full flex items-center justify-between px-6 md:px-12">
                        {/* Logo - Acts as Home button opening in new tab */}
                        <Link
                            to="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center group py-2"
                        >
                            <div className="h-11 md:h-16 bg-white rounded-xl md:rounded-2xl border border-slate-200/80 flex items-center justify-center overflow-hidden px-3 md:px-2 shadow-sm hover:scale-105 hover:shadow-md transition-all duration-300">
                                <img src="/logo.jpg" alt="MusB™ Research" className="h-[90%] w-auto object-contain brightness-100" />
                            </div>
                        </Link>

                    {/* Right-aligned Navigation Group */}
                    <div className="hidden xl:flex items-center gap-4 2xl:gap-12 ml-auto">
                        {/* Desktop Navigation */}
                        <nav className={`flex items-center ${isTrialsPage ? 'gap-8 2xl:gap-16' : 'gap-3 2xl:gap-8'}`}>
                            {navItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative group/nav"
                                    onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    {item.path === '#' ? (
                                        <div
                                            className="text-[11px] font-black tracking-[0.12em] uppercase transition-all hover:text-cyan-600 flex items-center gap-1 2xl:gap-1.5 py-8 cursor-pointer text-slate-900 whitespace-nowrap"
                                        >
                                            {item.label}
                                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                            <span className={`absolute bottom-6 left-0 w-full h-0.5 bg-cyan-600 transform origin-left transition-transform duration-300 ${openDropdown === item.label ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`}></span>
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            className={`text-[11px] font-black tracking-[0.12em] uppercase transition-all hover:text-cyan-600 flex items-center gap-1 2xl:gap-1.5 py-8 whitespace-nowrap ${location.pathname === item.path ? 'text-cyan-600' : 'text-slate-900'
                                                }`}
                                        >
                                            {item.label}
                                            {item.children && <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />}
                                            <span className={`absolute bottom-6 left-0 w-full h-0.5 bg-cyan-600 transform origin-left transition-transform duration-300 ${location.pathname === item.path ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`}></span>
                                        </Link>
                                    )}

                        {/* Right-aligned Navigation Group */}
                        <div className="hidden xl:flex items-center gap-4 2xl:gap-12 ml-auto">
                            {/* Desktop Navigation Links */}
                            <div className="flex items-center gap-3 2xl:gap-8">
                                {navItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="relative group/nav"
                                        onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                                        onMouseLeave={() => setOpenDropdown(null)}
                                    >
                                        Check Eligibility
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
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
                                    <Link
                                        to={dashboardLink}
                                        className="flex items-center gap-2 group ml-2 md:ml-4"
                                    >
                                        <div className="text-right hidden sm:flex flex-col justify-center">
                                            <div className="text-[11px] font-black uppercase tracking-[0.05em] text-slate-800 leading-tight">DASHBOARD</div>
                                            <div className="text-[#00d8ff] text-[18px] font-black leading-tight tracking-tight group-hover:text-[#00c4e8] transition-colors">{userName}</div>
                                        </div>
                                        <div className="w-[42px] h-[42px] rounded-[14px] border-[2px] border-[#00d8ff] overflow-hidden flex items-center justify-center bg-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                            {userObj?.profile_image ? (
                                                <img src={userObj.profile_image} alt={userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-[22px] h-[22px] text-[#00d8ff]" strokeWidth={2.5} />
                                            )}
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => { clearToken(); window.location.href = "/"; }}
                                        className="w-[42px] h-[42px] rounded-full border-[1.5px] border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0 ml-1 md:ml-3"
                                        title="Logout"
                                    >
                                        <LogOut className="w-[20px] h-[20px] translate-x-[1.5px]" strokeWidth={2} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="xl:hidden p-2 md:p-3 text-slate-900 hover:text-cyan-600 bg-slate-100 rounded-lg border border-slate-200"
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
                                            <div className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-600/60 mt-4 first:mt-0">
                                                {item.label}
                                                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                                <span className={`absolute bottom-6 left-0 w-full h-0.5 bg-cyan-600 transform origin-left transition-transform duration-300 ${openDropdown === item.label ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`}></span>
                                            </div>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                className={`text-[11px] font-black tracking-[0.12em] uppercase transition-colors hover:text-cyan-600 flex items-center gap-1 2xl:gap-1.5 py-8 whitespace-nowrap ${location.pathname === item.path ? 'text-cyan-600' : 'text-slate-900'}`}
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
                                                            className="block px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition-all"
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

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
                                            className="border-2 border-slate-200 text-slate-900 px-4 2xl:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-900 hover:text-white transition-all backdrop-blur-md whitespace-nowrap"
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
                                        className="bg-slate-900 text-white px-4 2xl:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-cyan-600 transition-all shadow-md flex items-center gap-1 2xl:gap-2 whitespace-nowrap"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Sign In
                                    </button>
                                ) : (
                                    <>
                                        <Link
                                            to={dashboardLink}
                                            className="flex items-center gap-2 group ml-2 md:ml-4"
                                        >
                                            <div className="text-right hidden sm:flex flex-col justify-center">
                                                <div className="text-[10px] font-black uppercase tracking-[0.05em] leading-tight text-slate-900">DASHBOARD</div>
                                                <div className="text-[#00d8ff] text-[18px] font-black leading-tight tracking-tight group-hover:text-[#00c4e8] transition-colors">{userName}</div>
                                            </div>
                                            <div className="w-[42px] h-[42px] rounded-[14px] border-[2px] border-[#00d8ff] overflow-hidden flex items-center justify-center bg-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                                {userObj?.profile_image ? (
                                                    <img src={userObj.profile_image} alt={userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-[22px] h-[22px] text-[#00d8ff]" strokeWidth={2.5} />
                                                )}
                                            </div>
                                        </Link>
                                        <button
                                            onClick={async () => { await performLogout(); }}
                                            className="w-[42px] h-[42px] rounded-full border-[1.5px] border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0 ml-1 md:ml-3"
                                            title="Logout"
                                        >
                                            <LogOut className="w-[20px] h-[20px] translate-x-[1.5px]" strokeWidth={2} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="xl:hidden p-2 md:p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
                        </button>

                    </nav>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="xl:hidden absolute top-full left-4 right-4 md:left-6 md:right-6 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl z-40 overflow-hidden border border-slate-200 max-h-[calc(100vh-6rem)] overflow-y-auto mt-4"
                        >
                            <div className="p-4 space-y-2">
                                {navItems.map((item) => (
                                    <div key={item.label}>
                                        {item.children ? (
                                            <div className="space-y-1">
                                                <div className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-600/60 mt-4 first:mt-0">
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
                                                    : 'text-slate-700 hover:bg-slate-50'
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
                                                className="block w-full text-center border-2 border-slate-200 text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
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
                                            <Link
                                                to={dashboardLink}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="w-full flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 transition-all hover:bg-slate-100"
                                            >
                                                <div className="w-12 h-12 rounded-2xl border-2 border-cyan-400 overflow-hidden flex items-center justify-center bg-white shrink-0 shadow-sm">
                                                    {userObj?.profile_image ? (
                                                        <img src={userObj.profile_image} alt={userName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-cyan-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">DASHBOARD</div>
                                                    <div className="text-cyan-500 text-base font-black capitalize leading-none">{userName}</div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </Link>
                                            <button
                                                onClick={async () => { await performLogout(); }}
                                                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
                                            >
                                                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main className="flex-grow w-full">
                {children}
            </main>
            {/* Footer Section */}
            <footer className="pt-20 pb-10 bg-[#020617] border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                <div className="max-w-[1600px] mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-16 mb-20">
                        {/* Branding & Contact */}
                        <div className="lg:col-span-3 space-y-10">
                            <Link to="/" target="_blank" rel="noopener noreferrer" className="inline-block group">
                                <div className="h-24 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 group-hover:border-cyan-500/30 transition-all duration-500 flex items-center justify-center shadow-2xl overflow-hidden">
                                    <img src="/logo.jpg" alt="MusB™ Research" className="h-full w-auto object-contain brightness-110 contrast-125" />
                                </div>
                            </Link>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 group/item">
                                    <div className="w-10 h-10 min-w-[40px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover/item:bg-cyan-500/10 group-hover/item:border-cyan-500/50 transition-all duration-300">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <p className="text-slate-400 text-[13px] font-medium leading-relaxed pt-1">
                                        6331 State Road 54<br />New Port Richey, FL 34653
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-10 h-10 min-w-[40px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover/item:bg-cyan-500/10 group-hover/item:border-cyan-500/50 transition-all duration-300">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <p className="text-slate-400 text-[13px] font-bold">+1 (813) 419-0781</p>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-10 h-10 min-w-[40px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover/item:bg-cyan-500/10 group-hover/item:border-cyan-500/50 transition-all duration-300">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <p className="text-slate-400 text-[13px] font-bold">info@musbresearch.com</p>
                                </div>
                            </div>
                        </div>

                        {/* Solutions & Socials */}
                        <div className="lg:col-span-3 flex flex-col gap-16">
                            <div className="space-y-8">
                                <h4 className="text-white font-black uppercase tracking-[0.25em] text-[14px]">Solutions</h4>
                                <ul className="space-y-4">
                                    {[
                                        { label: 'For Businesses', path: '/support' },
                                        { label: 'For Patients', path: '/trials' },
                                        { label: 'Innovation', path: '/innovations' },
                                        { label: 'Join a Study!', path: '/trials' }
                                    ].map((item) => (
                                        <li key={item.label}>
                                            <Link to={item.path} className="text-slate-500 hover:text-cyan-400 text-[15px] transition-colors font-bold flex items-center gap-2 group/link">
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-white font-black uppercase tracking-[0.25em] text-[12px]">Join The Community</h4>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { icon: Youtube, url: 'https://youtube.com/@MusB-v5n' },
                                        { icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61579407750169' },
                                        { icon: Instagram, url: 'https://www.instagram.com/musbresearch/' },
                                        { icon: Linkedin, url: 'https://www.linkedin.com/company/musb-res/' },
                                        {
                                            icon: (props: any) => (
                                                <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                            ),
                                            url: 'https://wa.me/17275050452'
                                        }
                                    ].map((social, sid) => (
                                        <a
                                            key={sid}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-cyan-500 hover:text-slate-900 transition-all duration-300 group"
                                        >
                                            {(() => {
                                                const Icon = social.icon;
                                                return <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />;
                                            })()}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* MusB Group */}
                        <div className="lg:col-span-2 space-y-8">
                            <h4 className="text-white font-black uppercase tracking-[0.25em] text-[14px]">MusB Group</h4>
                            <ul className="space-y-4">
                                {[
                                    { label: 'About Us', path: '/about' },
                                    { label: 'News & Events', path: '/news' },
                                    { label: 'Careers', path: '/careers' },
                                    { label: 'Contact Us', path: '/contact' }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link to={item.path} className="text-slate-500 hover:text-cyan-400 text-[15px] transition-colors font-bold flex items-center gap-2">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter Card */}
                        <div className="lg:col-span-4">
                            <div className="p-8 rounded-[2.5rem] bg-[#0c1221]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group/card shadow-2xl">
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full group-hover/card:bg-cyan-500/20 transition-all duration-700"></div>

                                <h4 className="text-white font-black uppercase tracking-[0.2em] text-[12px] mb-8">Get Our Newsletters</h4>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">Which Best Describes You?</p>
                                        <div className="flex bg-[#020617] p-1.5 rounded-2xl gap-2 border border-white/5">
                                            <button
                                                onClick={() => setUserType('Business')}
                                                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${userType === 'Business' ? 'bg-[#1e293b]/50 border-cyan-500/30 text-white shadow-lg' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                            >
                                                Business
                                            </button>
                                            <button
                                                onClick={() => setUserType('Individual')}
                                                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${userType === 'Individual' ? 'bg-[#1e293b]/50 border-cyan-500/30 text-white shadow-lg shadow-cyan-500/10' : 'border-transparent text-slate-500 hover:text-slate-300 font-black'}`}
                                            >
                                                Individual
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative group/input">
                                        <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-focus-within/input:bg-cyan-500/10 transition-all duration-500"></div>
                                        <div className="relative flex items-center bg-[#020617] border border-white/10 rounded-2xl overflow-hidden focus-within:border-cyan-500/40 transition-all duration-300">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Your Email"
                                                className="flex-grow bg-transparent px-5 py-4 text-[13px] text-white placeholder:text-slate-600 focus:outline-none font-medium"
                                            />
                                            <button
                                                onClick={handleSubscribe}
                                                disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                                                className="group/btn h-12 w-12 mr-1 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 hover:bg-white transition-all duration-300 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                                            >
                                                {newsletterStatus === 'loading' ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : newsletterStatus === 'success' ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <Send className="w-5 h-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {newsletterStatus === 'success' && (
                                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-center">
                                            Subscribed successfully
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-8">
                        <div className="space-y-2 text-center lg:text-left">
                            <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-600">© 2026 MusB™ Research. All Rights Reserved.</p>
                            <p className="text-[11px] text-slate-700 font-medium">Information can change without notice. MusB™ Research – Integrated Research & Clinical Solutions.</p>
                        </div>
                        <div className="flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                            <Link to="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
                            <Link to="#" className="hover:text-cyan-400 transition-colors">Terms of Use</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
