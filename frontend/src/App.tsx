import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AnimatedBackground from './components/AnimatedBackground';
import MeshBackground from './components/MeshBackground';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/ScrollToTop';
import Home from './views/Home';
import About from './views/About';
import Team from './views/Team';
import Contact from './views/Contact';
import Innovations from './views/Innovations';
import News from './views/News';
import NewsDetail from './views/NewsDetail';
import Careers from './views/Careers';
import JobDetail from './views/JobDetail';
import Facilities from './views/Facilities';
import Trials from './views/Trials';
import Support from './views/Support';
import WhyChooseUs from './views/WhyChooseUs';
import Capabilities from './views/Capabilities';
import MellowConsortium from './views/MellowConsortium';
import SignIn from './views/auth/SignIn';
import SuperAdminSignIn from './views/auth/SuperAdminSignIn';
import StudyDetail from './views/StudyDetail';
import StudyScreener from './views/StudyScreener';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import AdminDashboard from './views/AdminDashboard';
import ParticipantDashboard from './views/ParticipantDashboard';
import PIDashboard from './views/PIDashboard';
import SponsorDashboard from './views/SponsorDashboard/SponsorDashboard';
import StudyConsent from './views/StudyConsent';
import ResetForced from './views/auth/ResetForced';
import ResetPassword from './views/auth/ResetPassword';
import ProfileSetup from './views/auth/ProfileSetup';
import { performLogout, isLoggedIn } from './utils/auth';

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
const SignIn = lazy(() => import('./views/auth/SignIn'));
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

function AppContent() {
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboard');

    // KEEP-ALIVE FOR RENDER LIVE INSTANCE
    useEffect(() => {
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
        if (isDashboard) {
            document.body.style.backgroundColor = '#0a0e1a';
        } else {
            document.body.style.backgroundColor = '';
        }
    }, [isDashboard]);

    return (
        <>
            <MeshBackground />
            <AnimatedBackground />
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
                        <Route path="/auth/reset-forced" element={<ResetForced />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/auth/profile-setup" element={<ProfileSetup />} />
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


