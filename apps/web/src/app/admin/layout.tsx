'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { useTheme, themeColors } from '@/contexts/ThemeContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useARIA, ARIA_PANEL_WIDTH } from '@/contexts/ARIAContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;
  const { isOpen: isARIAOpen } = useARIA();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        background: isDark 
          ? 'linear-gradient(135deg, #0F1419 0%, #0A0D12 50%, #0F1419 100%)'
          : `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 50%, ${colors.bgSecondary} 100%)`,
      }}
    >
      {/* Sidebar - Fijo a la izquierda */}
      <AdminSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
      />

      {/* Navbar - Fijo arriba, se ajusta horizontalmente */}
      <AdminNavbar 
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={toggleSidebar}
        ariaOpen={isARIAOpen}
        ariaPanelWidth={ARIA_PANEL_WIDTH}
      />

      {/* Main Content - Se recorre cuando ARIA está abierta */}
      <main
        className="pt-16 min-h-screen transition-all duration-300 ease-in-out"
        style={{
          paddingLeft: sidebarCollapsed ? '72px' : '260px',
          paddingRight: isARIAOpen ? `${ARIA_PANEL_WIDTH}px` : '0px',
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AuthGuard>
  );
}
