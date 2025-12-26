/**
 * API Route: /api/admin/teams/[teamId]/cycles
 * GET: List cycles for a team
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: cycles, error } = await supabaseAdmin
      .from('task_cycles')
      .select('*')
      .eq('team_id', teamId)
      .order('start_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al obtener ciclos' }, { status: 500 });
    }

    return NextResponse.json({ cycles });

  } catch (error) {
    console.error('Error in GET cycles:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
