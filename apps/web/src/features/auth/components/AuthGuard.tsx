'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/core/stores/authStore';

interface AuthGuardProps {
  children: ReactNode;
  /** Rutas que no requieren autenticación */
  publicPaths?: string[];
  /** Ruta a la que redirigir si no está autenticado */
  loginPath?: string;
  /** Ruta a la que redirigir después de login */
  defaultRedirect?: string;
  /** Roles permitidos para acceder a las rutas protegidas */
  allowedRoles?: ('admin' | 'user' | 'guest')[];
  /** Componente a mostrar mientras se verifica la autenticación */
  loadingComponent?: ReactNode;
}

/**
 * AuthGuard - Componente para proteger rutas que requieren autenticación.
 * 
 * Ejemplo de uso:
 * ```tsx
 * <AuthGuard publicPaths={['/login', '/register']} loginPath="/login">
 *   <App />
 * </AuthGuard>
 * ```
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  publicPaths = ['/', '/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/reset-password'],
  loginPath = '/auth/sign-in',
  defaultRedirect = '/dashboard',
  allowedRoles,
  loadingComponent,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();

  // Inicializar sesión si no está inicializada
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    // Esperar a que se inicialice
    if (!isInitialized) return;

    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // Si está autenticado y está en una página pública (login/register), redirigir a dashboard
    if (isAuthenticated && isPublicPath && pathname !== '/') {
      router.replace(defaultRedirect);
      return;
    }

    // Si no está autenticado y no es una página pública, redirigir a login
    if (!isAuthenticated && !isPublicPath) {
      // Guardar la URL actual para redirigir después del login
      const returnUrl = pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : '';
      router.replace(`${loginPath}${returnUrl}`);
      return;
    }

    // Verificar roles si están especificados
    if (isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        // Usuario no tiene el rol requerido
        router.replace('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isInitialized, pathname, router, publicPaths, loginPath, defaultRedirect, allowedRoles, user]);

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si es una ruta pública, mostrar contenido
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return <>{children}</>;
  }

  // Si está autenticado, mostrar contenido
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // En cualquier otro caso, mostrar loading (redirección en progreso)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 text-sm">Redirigiendo...</p>
      </div>
    </div>
  );
};

export default AuthGuard;
