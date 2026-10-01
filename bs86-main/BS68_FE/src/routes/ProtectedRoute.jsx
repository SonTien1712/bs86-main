import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * Unauthenticated users are redirected to /auth,
 * with the original path saved so they can be sent back after login.
 *
 * Usage in your router:
 *
 *   <Route
 *     path="/profile"
 *     element={
 *       <ProtectedRoute>
 *         <ProfilePage />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * Optional role guard:
 *
 *   <ProtectedRoute requiredRole="OWNER">
 *     <OwnerDashboard />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, requiredRole }) {
    const { isAuthenticated, roles } = useAuth();
    const location = useLocation();

    // Not logged in → send to /auth, remember where they were headed
    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Role guard (optional)
    if (requiredRole && (!roles || !roles.includes(requiredRole))) {
        return <Navigate to="/home" replace />;
    }

    return children;
}