/**
 * API Route: /api/ext/issues
 * 
 * Endpoint para que la extensión SOFLIA pueda:
 * - GET: Listar issues de un proyecto
 * - POST: Crear nuevos issues
 * - PATCH: Actualizar issues existentes
 * 
 * Autenticación: JWT del Project Hub (Bearer token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

// Middleware de autenticación
async function authenticateExtension(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token no proporcionado', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload || payload.type !== 'access') {
    return { error: 'Token inválido o expirado', status: 401 };
  }

  return { userId: payload.sub, payload };
}

/**
 * GET /api/ext/issues?project_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateExtension(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const statusId = searchParams.get('status_id');
    const assigneeId = searchParams.get('assignee_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id es requerido' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('task_issues')
      .select('*')
      .eq('project_id', projectId)
      .is('archived_at', null)
      .order('sequence_number', { ascending: true });

    if (statusId) query = query.eq('status_id', statusId);
    if (assigneeId) query = query.eq('assignee_id', assigneeId);

    const { data, error } = await query;

    if (error) {
      console.error('[EXT] Error obteniendo issues:', error);
      return NextResponse.json({ error: 'Error al obtener issues' }, { status: 500 });
    }

    return NextResponse.json({ issues: data || [] });
  } catch (error) {
    console.error('[EXT] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * POST /api/ext/issues - Crea un nuevo issue
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateExtension(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { 
      project_id, title, description, 
      status_id, priority_id, assignee_id,
      cycle_id, milestone_id, estimate_points,
      start_date, due_date,
    } = body;

    if (!project_id || !title) {
      return NextResponse.json(
        { error: 'project_id y title son requeridos' }, 
        { status: 400 }
      );
    }

    // Obtener el siguiente sequence_number
    const { data: lastIssue } = await supabaseAdmin
      .from('task_issues')
      .select('sequence_number')
      .eq('project_id', project_id)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    const nextSequence = (lastIssue?.sequence_number || 0) + 1;

    const issueData = {
      project_id,
      title,
      description: description || null,
      status_id: status_id || null,
      priority_id: priority_id || null,
      assignee_id: assignee_id || null,
      creator_id: auth.userId,
      cycle_id: cycle_id || null,
      milestone_id: milestone_id || null,
      estimate_points: estimate_points || null,
      start_date: start_date || null,
      due_date: due_date || null,
      sequence_number: nextSequence,
    };

    const { data, error } = await supabaseAdmin
      .from('task_issues')
      .insert(issueData)
      .select()
      .single();

    if (error) {
      console.error('[EXT] Error creando issue:', error);
      return NextResponse.json({ error: 'Error al crear issue' }, { status: 500 });
    }

    return NextResponse.json({ issue: data }, { status: 201 });
  } catch (error) {
    console.error('[EXT] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/ext/issues - Actualiza un issue existente
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateExtension(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { issue_id, ...updates } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id es requerido' }, { status: 400 });
    }

    // Campos permitidos para actualización
    const allowedFields = [
      'title', 'description', 'status_id', 'priority_id', 
      'assignee_id', 'cycle_id', 'milestone_id', 'estimate_points',
      'start_date', 'due_date', 'completed_at',
    ];

    const filteredUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('task_issues')
      .update(filteredUpdates)
      .eq('issue_id', issue_id)
      .select()
      .single();

    if (error) {
      console.error('[EXT] Error actualizando issue:', error);
      return NextResponse.json({ error: 'Error al actualizar issue' }, { status: 500 });
    }

    return NextResponse.json({ issue: data });
  } catch (error) {
    console.error('[EXT] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
