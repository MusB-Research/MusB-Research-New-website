import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken } from "../../utils/auth";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Try to get from search params (?token=...)
        let token = searchParams.get("token");
        let role = searchParams.get("role");
        let modules = searchParams.get("modules");

        // Fallback to URL hash (#token=...)
        if (!token && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            token = hashParams.get("token");
            role = hashParams.get("role");
            modules = hashParams.get("modules");
        }

        if (token && role) {
            saveToken(token, role, modules || "");

            // Redirect based on role
            if (role === "SUPER_ADMIN") {
                navigate("/dashboard/super-admin");
            } else if (role === "ADMIN") {
                navigate("/dashboard/admin");
            } else {
                navigate("/");
            }
        } else if (!token && !role) {
            // Only redirect if we don't have partial data
            navigate("/");
        }
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
            <p className="text-white text-lg font-bold animate-pulse">
                Logging you in...
            </p>
        </div>
    );
}
