import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        
        // In a real scenario, we would extract the user/team from the auth token/session.
        // For this demo, and since we are using custom auth, we will mock getting the stats for the "current context".
        // Ideally the request header contains user-id or session cookie.
        // We will sum ALL usage for now or accept query params ?teamId=...
        
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');
        const userId = searchParams.get('userId');

        // Base query
        let query = supabase.from('aria_usage_logs').select('total_tokens, input_tokens, output_tokens, created_at');

        if (teamId) query = query.eq('team_id', teamId);
        if (userId) query = query.eq('user_id', userId);

        const { data: logs, error } = await query;
        
        if (error) throw error;

        // Calculate Stats
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        let dailyTokens = 0;
        let totalTokens = 0;
        let totalInput = 0;
        let totalOutput = 0;

        logs?.forEach(log => {
            const tokens = log.total_tokens || 0;
            totalTokens += tokens;
            totalInput += (log.input_tokens || 0);
            totalOutput += (log.output_tokens || 0);

            const logTime = new Date(log.created_at).getTime();
            if (logTime >= startOfDay) {
                dailyTokens += tokens;
            }
        });

        // Estimate Cost (Gemini 1.5 Flash Pricing approximation: ~$0.000018 per 1k input? actually free tier mostly)
        // Let's assume a generic strict non-free pricing for dashboard realism:
        // Input: $0.10 / 1M tokens
        // Output: $0.30 / 1M tokens
        const cost = ((totalInput / 1000000) * 0.10) + ((totalOutput / 1000000) * 0.30);

        return NextResponse.json({
            daily_tokens: dailyTokens,
            total_tokens: totalTokens,
            total_input: totalInput,
            total_output: totalOutput,
            cost_usd: cost,
            interaction_count: logs?.length || 0
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
