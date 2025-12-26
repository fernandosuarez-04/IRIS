'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API Configuration
const API_BASE_URL = '/api';

// Types
interface User {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'user' | 'guest';
    permissionLevel?: string;
    companyRole?: string;
    department?: string;
    avatar?: string;
    isEmailVerified?: boolean;
    timezone?: string;
    locale?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    firstName: string;
    lastNamePaternal: string;
    lastNameMaternal?: string;
    email: string;
    password: string;
    username: string;
}

interface AuthState {
    // State
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    fetchCurrentUser: () => Promise<void>;
    clearError: () => void;
    setUser: (user: User | null) => void;
    initialize: () => Promise<void>;
}

// Helper para obtener token
const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
};

const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
            error: null,

            // Initialize - verificar sesión existente al cargar la app
            initialize: async () => {
                const token = getAccessToken();
                
                // Si no hay token, limpiar todo el estado persistido
                if (!token) {
                    // Limpiar el storage de Zustand también
                    localStorage.removeItem('auth-storage');
                    set({ isInitialized: true, isAuthenticated: false, user: null });
                    return;
                }

                try {
                    await get().fetchCurrentUser();
                    set({ isInitialized: true });
                } catch {
                    // Token inválido, intentar refresh
                    const refreshed = await get().refreshToken();
                    if (!refreshed) {
                        // Limpiar todos los tokens y storage
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('auth-storage');
                        set({ isAuthenticated: false, user: null, isInitialized: true });
                        return;
                    }
                    set({ isInitialized: true });
                }
            },

            // Login action
            login: async (credentials: LoginCredentials) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch(`${API_BASE_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(credentials),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || 'Error al iniciar sesión');
                    }

                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);

                    set({
                        user: data.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : 'Error al iniciar sesión';
                    set({
                        isLoading: false,
                        error: errorMessage,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Register action
            register: async (data: RegisterData) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch(`${API_BASE_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    const responseData = await res.json();

                    if (!res.ok) {
                        throw new Error(responseData.error || 'Error al registrarse');
                    }

                    localStorage.setItem('accessToken', responseData.accessToken);
                    localStorage.setItem('refreshToken', responseData.refreshToken);

                    set({
                        user: responseData.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : 'Error al registrarse';
                    set({
                        isLoading: false,
                        error: errorMessage,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Logout action - ahora llama a la API para revocar la sesión
            logout: async () => {
                const token = getAccessToken();
                
                // Intentar revocar sesión en el servidor
                if (token) {
                    try {
                        await fetch(`${API_BASE_URL}/auth/logout`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                    } catch (error) {
                        console.error('Error al cerrar sesión en servidor:', error);
                        // Continuar con logout local aunque falle el servidor
                    }
                }

                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            },

            // Refresh token - renovar tokens automáticamente
            refreshToken: async (): Promise<boolean> => {
                const refreshTokenValue = getRefreshToken();
                
                if (!refreshTokenValue) {
                    return false;
                }

                try {
                    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken: refreshTokenValue }),
                    });

                    if (!res.ok) {
                        return false;
                    }

                    const data = await res.json();
                    
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);

                    // Obtener datos actualizados del usuario
                    await get().fetchCurrentUser();
                    
                    return true;
                } catch (error) {
                    console.error('Error al renovar token:', error);
                    return false;
                }
            },

            // Fetch current user - obtener datos del usuario autenticado
            fetchCurrentUser: async () => {
                const token = getAccessToken();
                
                if (!token) {
                    set({ isAuthenticated: false, user: null });
                    return;
                }

                try {
                    const res = await fetch(`${API_BASE_URL}/auth/me`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!res.ok) {
                        // Si el token expiró, intentar refresh
                        if (res.status === 401) {
                            const refreshed = await get().refreshToken();
                            if (!refreshed) {
                                throw new Error('Sesión expirada');
                            }
                            return; // fetchCurrentUser ya fue llamado en refreshToken
                        }
                        throw new Error('Error al obtener usuario');
                    }

                    const userData = await res.json();
                    
                    set({
                        user: {
                            ...userData,
                            createdAt: new Date(userData.createdAt),
                            updatedAt: new Date(userData.updatedAt),
                        },
                        isAuthenticated: true,
                    });
                } catch (error) {
                    console.error('Error al obtener usuario:', error);
                    set({ isAuthenticated: false, user: null });
                    throw error;
                }
            },

            // Clear error
            clearError: () => set({ error: null }),

            // Set user manually
            setUser: (user: User | null) =>
                set({
                    user,
                    isAuthenticated: !!user,
                }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
