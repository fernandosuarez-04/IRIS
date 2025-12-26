'use client';

import { useAuthStore } from '@/core/stores/authStore';
import { useCallback, useEffect } from 'react';

/**
 * Custom hook for authentication actions and state.
 * Automatically initializes the session on mount.
 */
export const useAuth = () => {
    const {
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        error,
        login,
        register,
        logout,
        clearError,
        initialize,
        refreshToken,
        fetchCurrentUser,
    } = useAuthStore();

    // Inicializar sesión automáticamente al montar
    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized, initialize]);

    const handleLogin = useCallback(
        async (email: string, password: string) => {
            await login({ email, password });
        },
        [login]
    );

    const handleRegister = useCallback(
        async (
            firstName: string,
            lastNamePaternal: string,
            email: string,
            password: string,
            username: string,
            lastNameMaternal?: string
        ) => {
            await register({
                firstName,
                lastNamePaternal,
                lastNameMaternal,
                email,
                password,
                username,
            });
        },
        [register]
    );

    const handleLogout = useCallback(async () => {
        await logout();
    }, [logout]);

    const handleRefreshToken = useCallback(async () => {
        return await refreshToken();
    }, [refreshToken]);

    const handleFetchUser = useCallback(async () => {
        await fetchCurrentUser();
    }, [fetchCurrentUser]);

    return {
        // State
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        error,

        // Actions
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        clearError,
        refreshToken: handleRefreshToken,
        fetchCurrentUser: handleFetchUser,
    };
};
