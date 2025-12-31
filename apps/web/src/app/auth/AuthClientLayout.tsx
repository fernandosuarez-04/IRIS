'use client';

import React from 'react';
import { ThemeToggle } from '@/components/auth/ThemeToggle';

export default function AuthClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-[#0F1419] transition-colors duration-300 relative">
      <div className="fixed top-6 right-6 z-[60]">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
