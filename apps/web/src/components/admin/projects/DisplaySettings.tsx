import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Kanban, CalendarRange, Check, ChevronDown } from 'lucide-react';

export type ViewType = 'list' | 'board' | 'timeline';

interface DisplaySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

import { useTheme } from '@/contexts/ThemeContext';

export function DisplaySettings({ 
  isOpen, 
  onClose, 
  currentView, 
  onViewChange,
  triggerRef 
}: DisplaySettingsProps) {
  const { isDark } = useTheme();

  // Estilos dinámicos
  const bgPanel = isDark ? 'bg-[#1E2329]' : 'bg-white';
  const borderPanel = isDark ? 'border-white/10' : 'border-gray-200';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const separator = isDark ? 'border-white/5' : 'border-gray-100';
  
  const bgControl = isDark ? 'bg-black/20' : 'bg-gray-100';
  const itemActive = isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm border border-gray-200';
  const itemInactive = isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white';
  
  const btnSecondary = isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className={`absolute right-0 top-full mt-2 w-80 ${bgPanel} border ${borderPanel} rounded-xl shadow-2xl z-50 overflow-hidden`}
          style={{ transformOrigin: 'top right' }}
        >
          {/* View Type Selector */}
          <div className={`p-3 border-b ${separator}`}>
            <div className={`grid grid-cols-3 gap-1 ${bgControl} p-1 rounded-lg`}>
              {(['list', 'board', 'timeline'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`flex flex-col items-center gap-1.5 py-2 rounded-md text-[10px] font-medium transition-all ${
                    currentView === view ? itemActive : itemInactive
                  }`}
                >
                  {view === 'list' && <LayoutList size={16} />}
                  {view === 'board' && <Kanban size={16} />}
                  {view === 'timeline' && <CalendarRange size={16} />}
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Grouping & Ordering */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm ${textSub}`}>
                <LayoutList size={14} />
                <span>Grouping</span>
              </div>
              <button className={`flex items-center gap-2 text-sm ${btnSecondary} px-2 py-1 rounded transition-colors`}>
                No grouping
                <ChevronDown size={12} className="opacity-50" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm ${textSub}`}>
                <div className="rotate-90"><LayoutList size={14} /></div>
                <span>Ordering</span>
              </div>
              <button className={`flex items-center gap-2 text-sm ${btnSecondary} px-2 py-1 rounded transition-colors`}>
                Manual
                <ChevronDown size={12} className="opacity-50" />
              </button>
            </div>
          </div>

          {/* Additional Options */}
          <div className={`p-4 border-t ${separator} space-y-3`}>
             <div className="flex items-center justify-between text-sm">
                <span className={textSub}>Show closed projects</span>
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>All</span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <span className={textSub}>Show cycles</span>
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>None</span>
             </div>
          </div>

          <div className={`p-3 border-t ${separator} ${isDark ? 'bg-white/2' : 'bg-gray-50'} flex justify-between items-center`}>
            <button 
                onClick={onClose}
                className={`text-xs ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            >
                Reset to default
            </button>
            <button 
                onClick={onClose}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium"
            >
                Done
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
