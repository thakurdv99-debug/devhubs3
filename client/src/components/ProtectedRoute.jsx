import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";

const ProtectedRoute = () => {
    // Safely get auth context
    const defaultAuth = {
        user: null,
        loading: true,
        loginUser: async () => {},
        logoutUser: () => {},
        refreshUser: async () => {}
    };

    let authContext = defaultAuth;
    try {
        if (useAuth && typeof useAuth === 'function') {
            const result = useAuth();
            if (result && typeof result === 'object') {
                authContext = result;
            }
        }
    } catch (error) {
        console.error('Error getting auth context:', error);
    }
    
    const user = authContext?.user ?? null;
    const loading = authContext?.loading ?? true;

    if (loading) return <div>Loading...</div>; // Prevent flickering while checking auth

    return user ? <Outlet /> : <Navigate to="/loginaccount" replace={true} />;
};

export default ProtectedRoute;
