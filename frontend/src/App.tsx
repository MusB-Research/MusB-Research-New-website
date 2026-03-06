import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AnimatedBackground from './components/AnimatedBackground';
import Home from './views/Home';
import About from './views/About';
import Team from './views/Team';
import Contact from './views/Contact';
import Innovations from './views/Innovations';
import News from './views/News';
import Careers from './views/Careers';
import Facilities from './views/Facilities';
import Trials from './views/Trials';
import Support from './views/Support';
import JobDetail from './views/JobDetail';
import WhyChooseUs from './views/WhyChooseUs';
import Capabilities from './views/Capabilities';
import AuthCallback from './views/auth/Callback';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import AdminDashboard from './views/AdminDashboard';

function App() {
    return (
        <Router>
            <AnimatedBackground />
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/why-choose-us" element={<WhyChooseUs />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/innovations" element={<Innovations />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/careers/:id" element={<JobDetail />} />
                    <Route path="/facilities" element={<Facilities />} />
                    <Route path="/trials" element={<Trials />} />
                    <Route path="/capabilities" element={<Capabilities />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
