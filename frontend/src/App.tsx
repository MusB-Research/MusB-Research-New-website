import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AnimatedBackground from './components/AnimatedBackground';
import MeshBackground from './components/MeshBackground';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/ScrollToTop';
import { performLogout, isLoggedIn, getUser } from './utils/auth';
import { useNavigate } from 'react-router-dom';

// LAZY LOAD VIEWS (Dynamic Code Splitting)
const Home = lazy(() => import('./views/Home'));
const About = lazy(() => import('./views/About'));
const Team = lazy(() => import('./views/Team'));
const Contact = lazy(() => import('./views/Contact'));
const Innovations = lazy(() => import('./views/Innovations'));
const News = lazy(() => import('./views/News'));
const NewsDetail = lazy(() => import('./views/NewsDetail'));
const Careers = lazy(() => import('./views/Careers'));
const JobDetail = lazy(() => import('./views/JobDetail'));
const Facilities = lazy(() => import('./views/Facilities'));
const Trials = lazy(() => import('./views/Trials'));
const Support = lazy(() => import('./views/Support'));
const WhyChooseUs = lazy(() => import('./views/WhyChooseUs'));
const Capabilities = lazy(() => import('./views/Capabilities'));
const MellowConsortium = lazy(() => import('./views/MellowConsortium'));
const SignIn = lazy(() => import('./views/auth/SignIn'));
const GoogleCallback = lazy(() => import('./views/auth/GoogleCallback'));
const SuperAdminSignIn = lazy(() => import('./views/auth/SuperAdminSignIn'));
const StudyDetail = lazy(() => import('./views/StudyDetail'));
const StudyScreener = lazy(() => import('./views/StudyScreener'));
const SuperAdminDashboard = lazy(() => import('./views/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const ParticipantDashboard = lazy(() => import('./views/Participant/ParticipantDashboard'));
const PIDashboard = lazy(() => import('./views/PIDashboard'));
const SponsorDashboard = lazy(() => import('./views/SponsorDashboard/SponsorDashboard'));
const CoordinatorDashboard = lazy(() => import('./views/Coordinator/CoordinatorDashboard'));
const StudyConsent = lazy(() => import('./views/StudyConsent'));
const ResetForced = lazy(() => import('./views/auth/ResetForced'));
const ResetPassword = lazy(() => import('./views/auth/ResetPassword'));
const ProfileSetup = lazy(() => import('./views/auth/ProfileSetup'));
const AcceptInvitation = lazy(() => import('./views/auth/AcceptInvitation'));
const ConsentManagement = lazy(() => import('./views/ConsentManagement'));

// --- Helper Redirects for Legacy URLs ---
const CoordinatorRedirect = () => {
    const location = useLocation();
    const newPath = location.pathname.replace(/^\/coordinator/, '/dashboard/coordinator');
    return <Navigate to={newPath + location.search} replace />;
};

const PIRedirect = () => {
    const location = useLocation();
    const newPath = location.pathname.replace(/^\/pi/, '/dashboard/pi');
    return <Navigate to={newPath + location.search} replace />;
};

function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname.startsWith('/dashboard');

    // Profile Completion Guard (Requirement 3 & 4)
    useEffect(() => {
        const user = getUser();
        const isAuthPage = location.pathname.includes('/auth/profile-setup') || 
                          location.pathname.includes('/signin') || 
                          location.pathname.includes('/auth/reset-forced') ||
                          location.pathname.includes('/auth/accept-invitation');
        
        if (user && user.profile_incomplete && !isAuthPage && isDashboard) {
            navigate('/auth/profile-setup', { replace: true });
        }
    }, [location.pathname, isDashboard, navigate]);

    const hasPung = useRef(false);

    // KEEP-ALIVE FOR RENDER LIVE INSTANCE
    useEffect(() => {
        if (hasPung.current) return;
        hasPung.current = true;

        const pingProduction = async () => {
            try {
                // Ping the specific production health endpoint the user provided
                const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://musb-research-new-website.onrender.com' : 'http://localhost:8000');
                const res = await fetch(`${apiUrl}/api/health/`);
                if (res.ok) console.log('✅ GLOBAL_NODE_SYNC: PRODUCTION_WAKE_SUCCESS');
            } catch (e) {
                console.warn('⚠️ GLOBAL_NODE_SYNC: ASYNC_PENDING');
            }
        };

        // Initial wake call
        pingProduction();

        // Interval to beat "spin down" (Render free tier = 15min idle)
        // 5 minutes (300,000ms) for maximum reliability
        const interval = setInterval(pingProduction, 300000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/participant')) {
            document.body.style.backgroundColor = '#faf9f6';
        } else if (isDashboard) {
            document.body.style.backgroundColor = '#0a0e1a';
        } else {
            document.body.style.backgroundColor = '';
        }
    }, [isDashboard, location.pathname]);

    return (
        <>
            {!isDashboard && (
                <>
                    <MeshBackground />
                    <AnimatedBackground />
                </>
            )}
            <Layout>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/why-choose-us" element={<WhyChooseUs />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/innovations" element={<Innovations />} />
                        <Route path="/news" element={<News />} />
                        <Route path="/news/:id" element={<NewsDetail />} />
                        <Route path="/careers" element={<Careers />} />
                        <Route path="/careers/:id" element={<JobDetail />} />
                        <Route path="/facilities" element={<Facilities />} />
                        <Route path="/trials" element={<Trials />} />
                        <Route path="/capabilities" element={<Capabilities />} />
                        <Route path="/mellow-consortium" element={<MellowConsortium />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/auth/google-callback" element={<GoogleCallback />} />
                        <Route path="/mainframe/restricted-auth" element={<SuperAdminSignIn />} />
                        <Route path="/studies/:id" element={<StudyDetail />} />
                        <Route path="/studies/:id/screener" element={<StudyScreener />} />
                        <Route path="/studies/:id/consent" element={<StudyConsent />} />

                        {/* Dashboard Routes (RBAC) */}
                        <Route path="/dashboard" element={<Navigate to="/dashboard/participant" replace />} />
                        <Route path="/dashboard/participant/*" element={<ParticipantDashboard />} />
                        <Route path="/dashboard/super-admin/*" element={<SuperAdminDashboard />} />
                        <Route path="/dashboard/super admin" element={<Navigate to="/dashboard/super-admin" replace />} />
                        <Route path="/dashboard/admin/*" element={<AdminDashboard />} />
                        <Route path="/dashboard/pi/*" element={<PIDashboard />} />
                        <Route path="/dashboard/coordinator/*" element={<CoordinatorDashboard />} />
                        <Route path="/dashboard/sponsor/*" element={<SponsorDashboard />} />
                        <Route path="/consent-management" element={<ConsentManagement />} />
                        
                        {/* Legacy Redirects for old notification links */}
                        {/* Legacy Redirects for old notification links - preserving full path */}
                        <Route path="/coordinator/*" element={<CoordinatorRedirect />} />
                        <Route path="/pi/*" element={<PIRedirect />} />
                        <Route path="/auth/reset-forced" element={<ResetForced />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/auth/profile-setup" element={<ProfileSetup />} />
                        <Route path="/auth/accept-invitation" element={<AcceptInvitation />} />
                        <Route path="/setup-credentials" element={<AcceptInvitation />} />
                    </Routes>
                </Suspense>
            </Layout>
        </>
    );
}

function App() {
    return (
        <Router>
            <ScrollToTop />
            <AppContent />
        </Router>
    );
}

export default App;


