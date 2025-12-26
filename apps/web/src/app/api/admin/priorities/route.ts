/**
 * API Route: /api/admin/priorities
 * GET: List all priorities
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: priorities, error } = await supabaseAdmin
      .from('task_priorities')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Error al obtener prioridades' }, { status: 500 });
    }

    return NextResponse.json({ priorities });

  } catch (error) {
    console.error('Error in GET priorities:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
