'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LIAFloatingButton from '@/features/lia/components/LIAFloatingButton';
import FocusEnforcer from '@/features/tools/FocusEnforcer';
import { useAuthStore } from '@/core/stores/authStore';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ARIAProvider } from '@/contexts/ARIAContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, initialize, isInitialized } = useAuthStore();
  const params = useParams();
  const pathname = usePathname();
  const teamId = params?.teamId as string | undefined;

  // Inicializar autenticación al cargar
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Solo mostrar ARIA en rutas de admin (no en home, auth, etc.)
  const showARIA = isInitialized && pathname?.startsWith('/admin');

  return (
    <ThemeProvider>
      <FocusEnforcer />
      <ARIAProvider>
        {children}
        
        {/* ARIA Floating Button - Solo visible en rutas de admin */}
        {showARIA && (
          <LIAFloatingButton 
            userName={user?.name}
            userRole={user?.role}
            userId={user?.id}
            teamId={teamId}
          />
        )}
      </ARIAProvider>
    </ThemeProvider>
  );
}
