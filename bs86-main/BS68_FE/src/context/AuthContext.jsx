import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthToken, parseAuthFromToken, persistAuthSession, clearStoredAuthSession } from '../utils/auth';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        // Rehydrate from storage on first render
        return parseAuthFromToken();
    });

    // Keep auth state fresh if the token expires while the tab is open
    useEffect(() => {
        const interval = setInterval(() => {
            const current = parseAuthFromToken();
            if (current.isAuthenticated !== auth.isAuthenticated) {
                setAuth(current);
            }
        }, 60_000); // check every minute
        return () => clearInterval(interval);
    }, [auth.isAuthenticated]);

    /**
     * Call this after any successful authentication event
     * (verifyOTP, login, googleLogin).
     *
     * @param {object} apiResult  – the raw response from the backend
     * @param {boolean} remember  – persist to localStorage (default true)
     */
    const login = useCallback((apiResult, remember = true) => {
        persistAuthSession(apiResult, remember);
        const token = getAuthToken(apiResult);
        const parsed = parseAuthFromToken(token);
        setAuth(parsed);
        return parsed;
    }, []);

    /** Clear everything and reset to guest state. */
    const logout = useCallback(() => {
        clearStoredAuthSession();
        setAuth({ isAuthenticated: false });
    }, []);

    const value = useMemo(
        () => ({ ...auth, login, logout }),
        [auth, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

export default AuthContext;