import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API, saveToken, saveUser, authFetch } from '../../utils/auth';
import PageLoader from '../../components/PageLoader';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(location.hash.replace('#', '?'));
            const credential = params.get('id_token');

            if (!credential) {
                const queryParams = new URLSearchParams(location.search);
                const queryCredential = queryParams.get('credential') || queryParams.get('id_token');
                
                if (!queryCredential) {
                    setError('No credential found in redirect.');
                    setTimeout(() => navigate('/signin'), 2000);
                    return;
                }
                processCredential(queryCredential);
            } else {
                processCredential(credential);
            }
        };

        const processCredential = async (credential: string) => {
            try {
                const response = await authFetch(`${API}/api/auth/google-login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Login failed');
                    setTimeout(() => navigate('/signin'), 2000);
                    return;
                }

                const userRole = (data.user.role || '').toUpperCase();
                if (userRole === 'SUPER_ADMIN') {
                    setError('RESTRICTED_ACCESS: Super Admin accounts must use the Restricted Portal for login.');
                    setTimeout(() => navigate('/signin'), 2000);
                    return;
                }

                saveToken(data.access, userRole, undefined, data.refresh);
                saveUser(data.user);

                if (data.user.must_reset) {
                    navigate('/auth/reset-forced');
                    return;
                }

                if (data.user_profile_incomplete) {
                    navigate('/auth/profile-setup');
                    return;
                }

                switch (userRole) {
                    case 'ADMIN': navigate('/dashboard/admin'); break;
                    case 'COORDINATOR': 
                    case 'TEAM_MEMBER': navigate('/dashboard/coordinator'); break;
                    case 'SPONSOR': navigate('/dashboard/sponsor'); break;
                    case 'PI': navigate('/dashboard/pi'); break;
                    default: navigate('/dashboard/participant');
                }
            } catch (err: any) {
                console.error('Google callback error:', err);
                setError(err.message || 'A connection error occurred.');
                setTimeout(() => navigate('/signin'), 2000);
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="text-center">
                <PageLoader />
                <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-sm">
                    {error ? <span className="text-red-500">{error}</span> : 'Authenticating...'}
                </p>
            </div>
        </div>
    );
};

export default GoogleCallback;
