'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface UsageStats {
  daily_tokens: number;
  total_tokens: number;
  cost_usd: number;
  interaction_count: number;
}

export function ARIAUsageWidget({ teamId, userId }: { teamId?: string, userId?: string }) {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        if (teamId) params.append('teamId', teamId);
        if (userId) params.append('userId', userId);
        
        const res = await fetch(`/api/aria/usage?${params.toString()}`);
        if (res.ok) {
            const data = await res.json();
            setStats(data);
        }
      } catch (err) {
        console.error("Failed to load ARIA stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [teamId, userId]);

  const COLORS = {
      cardBg: isDark ? 'rgba(30, 35, 41, 0.5)' : '#FFFFFF',
      border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      textPrimary: isDark ? '#FFFFFF' : '#111827',
      textSecondary: isDark ? '#9CA3AF' : '#6B7280',
      accent: '#00D4B3'
  };

  if (loading) {
      return (
          <div className="p-5 rounded-xl animate-pulse h-full min-h-[140px]" 
               style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
               <div className="h-4 w-1/3 bg-gray-700/20 rounded mb-4"></div>
               <div className="h-8 w-1/2 bg-gray-700/20 rounded"></div>
          </div>
      );
  }

  // Formatting large numbers
  const formatNum = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
  };

  const dailyLimit = 100000; // Fictive limit for progress bar
  const dailyPercent = Math.min((stats?.daily_tokens || 0) / dailyLimit * 100, 100);

  return (
    <div 
        className="p-5 rounded-xl h-full flex flex-col justify-between transition-all hover:border-[#00D4B3]/30"
        style={{ 
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.border}`,
        }}
    >
        <div className="flex items-start justify-between">
            <div>
                <h3 style={{ color: COLORS.textSecondary }} className="text-xs font-medium uppercase tracking-wider mb-1">
                    ARIA Tokens (Hoy)
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                        {formatNum(stats?.daily_tokens || 0)}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                        / {formatNum(dailyLimit)}
                    </span>
                </div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                 style={{ backgroundColor: `${COLORS.accent}15` }}>
                <svg className="w-6 h-6" style={{ color: COLORS.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
        </div>

        <div className="mt-4">
             {/* Simple Usage Bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                        width: `${dailyPercent}%`,
                        backgroundColor: COLORS.accent,
                        boxShadow: `0 0 10px ${COLORS.accent}60`
                    }}
                />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-xs" style={{ color: COLORS.textSecondary }}>
                <span>Interacciones: {stats?.interaction_count || 0}</span>
                <span>Total: {formatNum(stats?.total_tokens || 0)}</span>
            </div>
        </div>
    </div>
  );
}
