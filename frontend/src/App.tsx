import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AnimatedBackground from './components/AnimatedBackground';
import MeshBackground from './components/MeshBackground';
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
import SignIn from './views/auth/SignIn';
import SuperAdminSignIn from './views/auth/SuperAdminSignIn';
import StudyDetail from './views/StudyDetail';
import StudyScreener from './views/StudyScreener';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import AdminDashboard from './views/AdminDashboard';
import ParticipantDashboard from './views/Participant/ParticipantDashboard';
import PIDashboard from './views/PIDashboard';
import SponsorDashboard from './views/SponsorDashboard/SponsorDashboard';
import CoordinatorDashboard from './views/Coordinator/CoordinatorDashboard';
import StudyConsent from './views/StudyConsent';
import ResetForced from './views/auth/ResetForced';
import ResetPassword from './views/auth/ResetPassword';
import ProfileSetup from './views/auth/ProfileSetup';
import { performLogout, isLoggedIn } from './utils/auth';

function AppContent() {
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboard');

    // KEEP-ALIVE FOR RENDER LIVE INSTANCE
    useEffect(() => {
        const pingProduction = async () => {
            try {
                // Ping the specific production health endpoint the user provided
                const res = await fetch('https://musb-research-new-website.onrender.com/api/health/');
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
            </Layout>
        </>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
