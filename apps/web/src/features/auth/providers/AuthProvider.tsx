'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/core/stores/authStore';

// Tipos para el contexto
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Proveedor de autenticación para la aplicación.
 * Inicializa automáticamente la sesión del usuario al cargar.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    refreshToken,
    initialize,
  } = useAuthStore();

  // Inicializar sesión al montar el provider
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Configurar interceptor para refresh automático de tokens
  useEffect(() => {
    // Verificar token cada 5 minutos
    const tokenCheckInterval = setInterval(async () => {
      if (isAuthenticated) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            // Decodificar payload del token para verificar expiración
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresAt = payload.exp * 1000;
            const now = Date.now();
            
            // Si el token expira en menos de 10 minutos, renovar
            if (expiresAt - now < 10 * 60 * 1000) {
              await refreshToken();
            }
          } catch (error) {
            console.error('Error checking token expiration:', error);
          }
        }
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(tokenCheckInterval);
  }, [isAuthenticated, refreshToken]);

  const handleLogin = async (email: string, password: string) => {
    await login({ email, password });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login: handleLogin,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación.
 * Debe usarse dentro de un AuthProvider.
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthProvider;
