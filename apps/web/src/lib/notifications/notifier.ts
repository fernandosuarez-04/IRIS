import { getSupabaseAdmin } from '@/lib/supabase/server';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'task' | 'project' | 'team' | 'comment' | 'reminder' | 'system';

interface NotificationPayload {
    recipientId: string;
    actorId?: string; // Optional: ID of user who triggered it
    title: string;
    message?: string;
    type?: NotificationType;
    category?: NotificationCategory;
    entityId?: string;
    link?: string;
}

/**
 * Sends a notification to a specific user.
 */
export async function sendNotification(payload: NotificationPayload) {
    const supabase = getSupabaseAdmin();
    
    try {
        const { error } = await supabase.from('notifications').insert({
            recipient_id: payload.recipientId,
            actor_id: payload.actorId || null,
            title: payload.title,
            message: payload.message,
            type: payload.type || 'info',
            category: payload.category || 'system',
            entity_id: payload.entityId || null,
            link: payload.link || null,
        });

        if (error) {
            console.error('[Notifier] Error sending notification:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[Notifier] Exception:', err);
        return false;
    }
}

/**
 * Sends a notification to all members of a team.
 */
export async function sendTeamNotification(teamId: string, payload: Omit<NotificationPayload, 'recipientId'>) {
    const supabase = getSupabaseAdmin();

    try {
        // 1. Get Team Members
        // Assuming we have a way to link users to teams. 
        // Based on previous context, we might check 'account_users' table if it has team_id or a separate join table.
        // Let's assume account_users has team_id for simple tenancy, or use a many-to-many if exists.
        // Checking migration 001_initial_schema logic... account_users usually has current team context or we query `team_members` if it exists.
        // Let's default to querying account_users associated with the team.
        
        const { data: members, error: membersError } = await supabase
            .from('account_users')
            .select('user_id')
            .eq('team_id', teamId); // Assuming single team per user model for MVP simplification as seen in usage logs

        if (membersError || !members) {
            console.error('[Notifier] Error fetching team members:', membersError);
            return false;
        }

        // 2. Prepare bulk insert
        const notifications = members.map(member => ({
            recipient_id: member.user_id,
            actor_id: payload.actorId || null,
            title: payload.title,
            message: payload.message,
            type: payload.type || 'info',
            category: payload.category || 'system',
            entity_id: payload.entityId || null,
            link: payload.link || null,
        }));

        // Filter out the actor themselves if they are in the list (optional, but good UX usually)
        const finalNotifications = notifications.filter(n => n.recipient_id !== payload.actorId);

        if (finalNotifications.length === 0) return true;

        const { error: insertError } = await supabase.from('notifications').insert(finalNotifications);

        if (insertError) {
             console.error('[Notifier] Error sending team notifications:', insertError);
             return false;
        }
        
        return true;

    } catch (err) {
        console.error('[Notifier] Exception:', err);
        return false;
    }
}
