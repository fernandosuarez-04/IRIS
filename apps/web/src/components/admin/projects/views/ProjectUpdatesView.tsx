
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/core/stores/authStore';
import { 
    Send, CheckCircle, AlertCircle, XCircle, 
    MoreHorizontal, MessageSquare, Loader2
} from 'lucide-react';

interface Update {
    update_id: string;
    update_content: string;
    update_type: string;
    health_status_snapshot: string;
    created_at: string;
    author: {
        display_name: string;
        avatar_url: string;
        first_name: string;
        last_name_paternal: string;
    };
}

export function ProjectUpdatesView({ projectId }: { projectId: string }) {
    const { isDark } = useTheme();
    const { user } = useAuthStore();
    const colors = isDark ? {
        bg: '#1E2329',
        border: 'rgba(255,255,255,0.08)',
        text: '#FFF',
        textSec: '#9CA3AF'
    } : {
        bg: '#FFF',
        border: '#E5E7EB',
        text: '#111827',
        textSec: '#6B7280'
    };

    const [updates, setUpdates] = useState<Update[]>([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [health, setHealth] = useState<'on_track' | 'at_risk' | 'off_track'>('on_track');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchUpdates();
    }, [projectId]);

    const fetchUpdates = async () => {
        try {
            const res = await fetch(`/api/admin/projects/${projectId}/updates`);
            if (res.ok) {
                const data = await res.json();
                setUpdates(data.updates || []);
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!content.trim() || !user) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/admin/projects/${projectId}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    health_status: health,
                    user_id: user.id
                })
            });

            if (res.ok) {
                const data = await res.json();
                setUpdates([data.update, ...updates]);
                setContent('');
            }
        } catch (error) {
            console.error('Error posting update:', error);
        } finally {
            setPosting(false);
        }
    };

    const getHealthColor = (h: string) => {
        switch(h) {
            case 'on_track': return '#10B981';
            case 'at_risk': return '#F59E0B';
            case 'off_track': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getHealthLabel = (h: string) => {
        switch(h) {
            case 'on_track': return 'On track';
            case 'at_risk': return 'At risk';
            case 'off_track': return 'Off track';
            default: return 'No status';
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Input Area */}
            <div className={`rounded-xl border p-4 shadow-sm transition-all focus-within:ring-2 ring-blue-500/20`}
                 style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex p-1 rounded-lg border" style={{ borderColor: colors.border }}>
                        {(['on_track', 'at_risk', 'off_track'] as const).map(h => (
                            <button
                                key={h}
                                onClick={() => setHealth(h)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2`}
                                style={{ 
                                    backgroundColor: health === h ? `${getHealthColor(h)}15` : 'transparent',
                                    color: health === h ? getHealthColor(h) : colors.textSec
                                }}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getHealthColor(h) }} />
                                {getHealthLabel(h)}
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a project update..."
                    className="w-full h-32 bg-transparent resize-none outline-none text-base placeholder-opacity-50"
                    style={{ color: colors.text }}
                />

                <div className="flex justify-end pt-2 border-t mt-2" style={{ borderColor: colors.border }}>
                    <button
                        onClick={handlePost}
                        disabled={!content.trim() || posting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                    >
                        {posting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        Post Update
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-8 relative pl-8 border-l" style={{ borderColor: colors.border }}>
                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading updates...</div>
                ) : updates.map((update, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={update.update_id} 
                        className="relative"
                    >
                        {/* Dot on timeline */}
                        <div className="absolute -left-[39px] top-6 w-5 h-5 rounded-full border-4 shadow-sm"
                             style={{ 
                                 borderColor: isDark ? '#111' : '#fff', // Background color for gap effect
                                 backgroundColor: getHealthColor(update.health_status_snapshot) 
                             }} 
                        />

                        <div className="mb-2 flex items-center gap-3">
                            <span className="text-xl font-bold" style={{ color: colors.text }}>
                                {format(new Date(update.created_at), 'MMMM', { locale: es })}
                            </span>
                            <span className="text-sm opacity-50">
                                {format(new Date(update.created_at), 'yyyy')}
                            </span>
                        </div>

                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5' : 'bg-white'} shadow-sm`}
                             style={{ borderColor: colors.border }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
                                    {update.author.first_name?.[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-medium" style={{ color: colors.text }}>
                                        {update.author.display_name || update.author.first_name}
                                    </div>
                                    <div className="text-xs opacity-60 flex items-center gap-2">
                                        created the update • {format(new Date(update.created_at), 'MMM d')}
                                    </div>
                                </div>
                                <div className="ml-auto px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5"
                                     style={{ 
                                         borderColor: `${getHealthColor(update.health_status_snapshot)}30`,
                                         color: getHealthColor(update.health_status_snapshot),
                                         backgroundColor: `${getHealthColor(update.health_status_snapshot)}10`
                                     }}>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getHealthColor(update.health_status_snapshot) }} />
                                    {getHealthLabel(update.health_status_snapshot)}
                                </div>
                            </div>
                            
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <p className="whitespace-pre-line leading-relaxed opacity-90">{update.update_content}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {!loading && updates.length === 0 && (
                     <div className="text-center py-12 opacity-50">
                        <MessageSquare className="mx-auto mb-2 opacity-50" />
                        <p>No updates yet.</p>
                     </div>
                )}
            </div>
        </div>
    );
}
