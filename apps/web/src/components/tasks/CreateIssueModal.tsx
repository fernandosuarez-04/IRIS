'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, themeColors } from '@/contexts/ThemeContext';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { createPortal } from 'react-dom';

// Types
interface Status {
  status_id: string;
  name: string;
  status_type: string;
  color: string;
  icon: string;
}

interface Priority {
  priority_id: string;
  name: string;
  level: number;
  color: string;
}

interface Label {
  label_id: string;
  name: string;
  color: string;
}

interface Member {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface Cycle {
  cycle_id: string;
  name: string;
  status: string;
}

interface Project {
  project_id: string;
  project_name: string;
}

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onIssueCreated: (issue: any) => void;
  initialStatus?: string;
}

// Status Icon Component
const StatusIcon = ({ type, color, size = 16 }: { type: string; color: string; size?: number }) => {
  const style = { color };
  switch (type) {
    case 'backlog':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
          <circle cx="12" cy="12" r="10" strokeDasharray="4 4"/>
        </svg>
      );
    case 'todo':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
    case 'in_progress':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      );
    case 'done':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
        </svg>
      );
    case 'cancelled':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2"/>
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
};

// Priority Icon Component
const PriorityIcon = ({ level, color, size = 16 }: { level: number; color: string; size?: number }) => {
  return (
    <div 
      className="rounded flex items-center justify-center"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: `${color}20`, 
        color 
      }}
    >
      {level === 0 && <span style={{ fontSize: size * 0.625 }}>—</span>}
      {level === 1 && <span style={{ fontSize: size * 0.625, fontWeight: 'bold' }}>!</span>}
      {level === 2 && <span style={{ fontSize: size * 0.625, fontWeight: 'bold' }}>↑</span>}
      {level === 3 && <span style={{ fontSize: size * 0.625, fontWeight: 'bold' }}>=</span>}
      {level === 4 && <span style={{ fontSize: size * 0.625, fontWeight: 'bold' }}>↓</span>}
    </div>
  );
};

// Estimation Options (0-10)
const ESTIMATE_OPTIONS = [
  { value: '', label: 'Sin estimación', icon: '–' },
  { value: '0', label: '0 puntos', icon: '0' },
  { value: '1', label: '1 punto', icon: '1' },
  { value: '2', label: '2 puntos', icon: '2' },
  { value: '3', label: '3 puntos', icon: '3' },
  { value: '4', label: '4 puntos', icon: '4' },
  { value: '5', label: '5 puntos', icon: '5' },
  { value: '6', label: '6 puntos', icon: '6' },
  { value: '7', label: '7 puntos', icon: '7' },
  { value: '8', label: '8 puntos', icon: '8' },
  { value: '9', label: '9 puntos', icon: '9' },
  { value: '10', label: '10 puntos', icon: '10' },
];

// Portal Dropdown Component
interface PortalDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  children: React.ReactNode;
  isDark: boolean;
  colors: any;
  width?: number;
}

function PortalDropdown({ isOpen, onClose, triggerRef, children, isDark, colors, width = 200 }: PortalDropdownProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 100000 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed py-1 rounded-xl border shadow-2xl max-h-60 overflow-y-auto"
        style={{ 
          zIndex: 100001,
          top: position.top,
          left: position.left,
          width: width,
          backgroundColor: isDark ? '#1E2329' : '#ffffff', 
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
        }}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
}

// Portal Calendar Component
interface PortalCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  value: string;
  onChange: (date: string) => void;
  isDark: boolean;
  colors: any;
  accentColor: string;
}

function PortalCalendar({ isOpen, onClose, triggerRef, value, onChange, isDark, colors, accentColor }: PortalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (value) setCurrentMonth(new Date(value));
  }, [value]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen, triggerRef]);

  const handleDateClick = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    onClose();
  };

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 100000 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed p-4 rounded-xl border shadow-2xl"
        style={{ 
          zIndex: 100001,
          top: position.top,
          left: position.left,
          width: 280,
          backgroundColor: isDark ? '#1E2329' : '#ffffff', 
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold capitalize text-sm" style={{ color: colors.textPrimary }}>
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              type="button"
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: colors.textMuted }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              type="button"
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: colors.textMuted }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Week days */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: colors.textMuted }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayItem, i) => {
            const isSelected = value ? isSameDay(dayItem, new Date(value)) : false;
            const isCurrentMonth = isSameMonth(dayItem, monthStart);
            const isTodayDate = isToday(dayItem);

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDateClick(dayItem)}
                className={`
                  h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-all relative
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'font-bold shadow-lg' : 'hover:bg-white/10'}
                `}
                style={{ 
                  color: isSelected ? '#FFFFFF' : colors.textPrimary,
                  backgroundColor: isSelected ? accentColor : undefined,
                  border: isTodayDate && !isSelected ? `1px solid ${accentColor}` : 'none'
                }}
              >
                {format(dayItem, 'd')}
              </button>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex justify-between text-xs" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <button 
            type="button"
            onClick={() => { onChange(''); onClose(); }}
            className="hover:underline opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: colors.textSecondary }}
          >
            Borrar
          </button>
          <button 
            type="button"
            onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); onClose(); }}
            className="font-medium hover:underline"
            style={{ color: accentColor }}
          >
            Hoy
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

export default function CreateIssueModal({ 
  isOpen, 
  onClose, 
  teamId, 
  onIssueCreated,
  initialStatus 
}: CreateIssueModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  // SOFIA Colors
  const primaryColor = '#0A2540';
  const accentColor = '#00D4B3';

  // Refs for dropdowns
  const statusRef = useRef<HTMLButtonElement>(null);
  const priorityRef = useRef<HTMLButtonElement>(null);
  const assigneeRef = useRef<HTMLButtonElement>(null);
  const dueDateRef = useRef<HTMLButtonElement>(null);
  const estimateRef = useRef<HTMLButtonElement>(null);
  const projectRef = useRef<HTMLButtonElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState<string>('');
  const [priorityId, setPriorityId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [cycleId, setCycleId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatePoints, setEstimatePoints] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Data State
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Get selected items for display
  const selectedStatus = statuses.find(s => s.status_id === statusId);
  const selectedPriority = priorities.find(p => p.priority_id === priorityId);
  const selectedAssignee = members.find(m => m.user_id === assigneeId);
  const selectedEstimate = ESTIMATE_OPTIONS.find(e => e.value === estimatePoints);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [statusRes, priorityRes, labelRes, memberRes, cycleRes, projectRes] = await Promise.all([
        fetch(`/api/admin/teams/${teamId}/statuses`, { headers }),
        fetch(`/api/admin/priorities`, { headers }),
        fetch(`/api/admin/teams/${teamId}/labels`, { headers }),
        fetch(`/api/admin/teams/${teamId}/members`, { headers }),
        fetch(`/api/admin/teams/${teamId}/cycles`, { headers }),
        fetch(`/api/admin/projects?teamId=${teamId}`, { headers }).catch(() => null)
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatuses(data.statuses || []);
        const defaultStatus = data.statuses?.find((s: Status) => s.status_type === 'backlog') || data.statuses?.[0];
        setStatusId(initialStatus || defaultStatus?.status_id || '');
      }

      if (priorityRes.ok) {
        const data = await priorityRes.json();
        setPriorities(data.priorities || []);
      }

      if (labelRes.ok) {
        const data = await labelRes.json();
        setLabels(data.labels || []);
      }

      if (memberRes.ok) {
        const data = await memberRes.json();
        setMembers(data.members || []);
      }

      if (cycleRes.ok) {
        const data = await cycleRes.json();
        setCycles(data.cycles || []);
      }

      if (projectRes?.ok) {
        const data = await projectRes.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId, initialStatus]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatusId('');
    setPriorityId('');
    setAssigneeId('');
    setProjectId('');
    setCycleId('');
    setDueDate('');
    setEstimatePoints('');
    setSelectedLabels([]);
    setActiveDropdown(null);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Create issue
  const handleCreate = async () => {
    if (!title.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/teams/${teamId}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status_id: statusId || null,
          priority_id: priorityId || null,
          assignee_id: assigneeId || null,
          project_id: projectId || null,
          cycle_id: cycleId || null,
          due_date: dueDate || null,
          estimate_points: estimatePoints ? parseInt(estimatePoints) : null,
          labels: selectedLabels
        })
      });

      if (res.ok) {
        const data = await res.json();
        onIssueCreated(data.issue);
        handleClose();
      }
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setCreating(false);
    }
  };

  // Toggle label
  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={handleClose}
          />

          {/* Modal - Split Panel Pattern */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-visible border border-white/10"
            style={{ backgroundColor: isDark ? '#1a1f25' : '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex" style={{ height: '600px' }}>
              {/* Left Panel - Preview */}
              <div 
                className="w-72 p-6 border-r flex flex-col shrink-0"
                style={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  background: isDark 
                    ? `linear-gradient(135deg, ${primaryColor}40, ${accentColor}15)` 
                    : `linear-gradient(135deg, ${primaryColor}08, ${accentColor}05)`
                }}
              >
                {/* Icon/Avatar */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative mb-4"
                >
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 8px 30px ${primaryColor}40`
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  </div>
                  
                  {/* Animated badge */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor, left: '58%' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </motion.div>
                </motion.div>

                {/* Title */}
                <h3 className="text-lg font-bold text-center mb-1" style={{ color: colors.textPrimary }}>
                  Nueva Tarea
                </h3>
                <p className="text-xs text-center mb-6" style={{ color: colors.textMuted }}>
                  Vista previa
                </p>

                {/* Preview Info */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {selectedStatus && (
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <StatusIcon type={selectedStatus.status_type} color={selectedStatus.color} size={16} />
                      <div className="min-w-0">
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>Estado</p>
                        <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{selectedStatus.name}</p>
                      </div>
                    </div>
                  )}

                  {selectedPriority && (
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <PriorityIcon level={selectedPriority.level} color={selectedPriority.color} size={16} />
                      <div>
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>Prioridad</p>
                        <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>{selectedPriority.name}</p>
                      </div>
                    </div>
                  )}

                  {selectedAssignee && (
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium" style={{ backgroundColor: accentColor, color: 'white' }}>
                        {selectedAssignee.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>Asignado</p>
                        <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{selectedAssignee.display_name}</p>
                      </div>
                    </div>
                  )}

                  {dueDate && (
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <div>
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>Fecha límite</p>
                        <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                          {format(new Date(dueDate), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedLabels.length > 0 && (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <p className="text-[10px] mb-1" style={{ color: colors.textMuted }}>Etiquetas</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedLabels.slice(0, 3).map(labelId => {
                          const label = labels.find(l => l.label_id === labelId);
                          if (!label) return null;
                          return (
                            <span key={labelId} className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ backgroundColor: `${label.color}20`, color: label.color }}>
                              {label.name}
                            </span>
                          );
                        })}
                        {selectedLabels.length > 3 && (
                          <span className="text-[9px]" style={{ color: colors.textMuted }}>+{selectedLabels.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: colors.border }}>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      Detalles de la tarea
                    </h2>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      Completa la información
                    </p>
                  </div>
                  <button 
                    onClick={handleClose}
                    className="p-2 rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: colors.textMuted }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor }} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                          Título <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="¿Qué necesitas hacer?"
                          autoFocus
                          className="w-full px-3 py-2.5 rounded-xl border text-sm"
                          style={{
                            backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                            borderColor: colors.border,
                            color: colors.textPrimary
                          }}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                          Descripción
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Añade detalles..."
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl border resize-none text-sm"
                          style={{
                            backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                            borderColor: colors.border,
                            color: colors.textPrimary
                          }}
                        />
                      </div>

                      {/* Grid de campos */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>Estado</label>
                          <button
                            ref={statusRef}
                            onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left"
                            style={{
                              backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                              borderColor: activeDropdown === 'status' ? accentColor : colors.border,
                              color: colors.textPrimary
                            }}
                          >
                            {selectedStatus ? (
                              <><StatusIcon type={selectedStatus.status_type} color={selectedStatus.color} /><span className="flex-1 truncate">{selectedStatus.name}</span></>
                            ) : (
                              <span className="flex-1" style={{ color: colors.textMuted }}>Seleccionar</span>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <PortalDropdown isOpen={activeDropdown === 'status'} onClose={() => setActiveDropdown(null)} triggerRef={statusRef} isDark={isDark} colors={colors}>
                            {statuses.map(status => (
                              <button key={status.status_id} onClick={() => { setStatusId(status.status_id); setActiveDropdown(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: colors.textPrimary }}>
                                <StatusIcon type={status.status_type} color={status.color} /><span>{status.name}</span>
                              </button>
                            ))}
                          </PortalDropdown>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>Prioridad</label>
                          <button
                            ref={priorityRef}
                            onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left"
                            style={{
                              backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                              borderColor: activeDropdown === 'priority' ? accentColor : colors.border,
                              color: colors.textPrimary
                            }}
                          >
                            {selectedPriority ? (
                              <><PriorityIcon level={selectedPriority.level} color={selectedPriority.color} /><span className="flex-1">{selectedPriority.name}</span></>
                            ) : (
                              <span className="flex-1" style={{ color: colors.textMuted }}>Sin prioridad</span>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <PortalDropdown isOpen={activeDropdown === 'priority'} onClose={() => setActiveDropdown(null)} triggerRef={priorityRef} isDark={isDark} colors={colors}>
                            {priorities.map(p => (
                              <button key={p.priority_id} onClick={() => { setPriorityId(p.priority_id); setActiveDropdown(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: colors.textPrimary }}>
                                <PriorityIcon level={p.level} color={p.color} /><span>{p.name}</span>
                              </button>
                            ))}
                          </PortalDropdown>
                        </div>

                        {/* Assignee */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>Asignar a</label>
                          <button
                            ref={assigneeRef}
                            onClick={() => setActiveDropdown(activeDropdown === 'assignee' ? null : 'assignee')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left"
                            style={{
                              backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                              borderColor: activeDropdown === 'assignee' ? accentColor : colors.border,
                              color: colors.textPrimary
                            }}
                          >
                            {selectedAssignee ? (
                              <>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium" style={{ backgroundColor: accentColor, color: 'white' }}>
                                  {selectedAssignee.display_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="flex-1 truncate">{selectedAssignee.display_name}</span>
                              </>
                            ) : (
                              <span className="flex-1" style={{ color: colors.textMuted }}>Sin asignar</span>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <PortalDropdown isOpen={activeDropdown === 'assignee'} onClose={() => setActiveDropdown(null)} triggerRef={assigneeRef} isDark={isDark} colors={colors}>
                            <button onClick={() => { setAssigneeId(''); setActiveDropdown(null); }} className="w-full px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: colors.textMuted }}>Sin asignar</button>
                            {members.map(m => (
                              <button key={m.user_id} onClick={() => { setAssigneeId(m.user_id); setActiveDropdown(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: colors.textPrimary }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium" style={{ backgroundColor: accentColor, color: 'white' }}>
                                  {m.display_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="truncate">{m.display_name || 'Sin nombre'}</span>
                              </button>
                            ))}
                          </PortalDropdown>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>Fecha límite</label>
                          <button
                            ref={dueDateRef}
                            onClick={() => setActiveDropdown(activeDropdown === 'dueDate' ? null : 'dueDate')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left"
                            style={{
                              backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                              borderColor: activeDropdown === 'dueDate' ? accentColor : colors.border,
                              color: dueDate ? colors.textPrimary : colors.textMuted
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span className="flex-1">{dueDate ? format(new Date(dueDate), 'dd MMM yyyy', { locale: es }) : 'Seleccionar'}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <PortalCalendar isOpen={activeDropdown === 'dueDate'} onClose={() => setActiveDropdown(null)} triggerRef={dueDateRef} value={dueDate} onChange={setDueDate} isDark={isDark} colors={colors} accentColor={accentColor} />
                        </div>

                        {/* Estimate */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>Estimación</label>
                          <button
                            ref={estimateRef}
                            onClick={() => setActiveDropdown(activeDropdown === 'estimate' ? null : 'estimate')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left"
                            style={{
                              backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                              borderColor: activeDropdown === 'estimate' ? accentColor : colors.border,
                              color: selectedEstimate?.value ? colors.textPrimary : colors.textMuted
                            }}
                          >
                            {selectedEstimate?.value ? (
                              <>
                                <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{selectedEstimate.icon}</div>
                                <span className="flex-1">{selectedEstimate.label}</span>
                              </>
                            ) : (
                              <span className="flex-1">Sin estimación</span>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <PortalDropdown isOpen={activeDropdown === 'estimate'} onClose={() => setActiveDropdown(null)} triggerRef={estimateRef} isDark={isDark} colors={colors}>
                            {ESTIMATE_OPTIONS.map(opt => (
                              <button key={opt.value || 'none'} onClick={() => { setEstimatePoints(opt.value); setActiveDropdown(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: opt.value ? colors.textPrimary : colors.textMuted }}>
                                {opt.value && <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{opt.icon}</div>}
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </PortalDropdown>
                        </div>

                        {/* Project */}
                        {projects.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>Proyecto</label>
                            <button
                              ref={projectRef}
                              onClick={() => setActiveDropdown(activeDropdown === 'project' ? null : 'project')}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left"
                              style={{
                                backgroundColor: isDark ? '#0F1419' : '#F9FAFB',
                                borderColor: activeDropdown === 'project' ? accentColor : colors.border,
                                color: projectId ? colors.textPrimary : colors.textMuted
                              }}
                            >
                              <span className="flex-1 truncate">{projects.find(p => p.project_id === projectId)?.project_name || 'Sin proyecto'}</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textMuted }}><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            <PortalDropdown isOpen={activeDropdown === 'project'} onClose={() => setActiveDropdown(null)} triggerRef={projectRef} isDark={isDark} colors={colors}>
                              <button onClick={() => { setProjectId(''); setActiveDropdown(null); }} className="w-full px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: colors.textMuted }}>Sin proyecto</button>
                              {projects.map(p => (
                                <button key={p.project_id} onClick={() => { setProjectId(p.project_id); setActiveDropdown(null); }}
                                  className="w-full px-3 py-2 text-sm hover:bg-white/5 text-left truncate" style={{ color: colors.textPrimary }}>{p.project_name}</button>
                              ))}
                            </PortalDropdown>
                          </div>
                        )}
                      </div>

                      {/* Labels */}
                      {labels.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Etiquetas</label>
                          <div className="flex flex-wrap gap-2">
                            {labels.map(label => {
                              const isSelected = selectedLabels.includes(label.label_id);
                              return (
                                <button key={label.label_id} onClick={() => toggleLabel(label.label_id)}
                                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                                  style={{ backgroundColor: isSelected ? `${label.color}30` : `${label.color}15`, color: label.color, boxShadow: isSelected ? `0 0 0 2px ${label.color}` : 'none' }}>
                                  {label.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: colors.border }}>
                  <button onClick={handleClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5" style={{ color: colors.textSecondary }}>Cancelar</button>
                  <button onClick={handleCreate} disabled={creating || !title.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, boxShadow: `0 4px 15px ${primaryColor}40` }}>
                    {creating ? (
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Crear tarea
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
