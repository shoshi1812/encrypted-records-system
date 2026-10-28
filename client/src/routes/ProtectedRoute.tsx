import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export const ProtectedRoute = () => {
    const { isLoading, user } = useAuth()
    if (isLoading) {
        return <p>בטעינה</p>
    }
    if (!user) {
        return <Navigate to='/login' replace />
    }
    return <Outlet />
}