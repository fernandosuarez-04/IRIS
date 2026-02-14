/**
 * API Route: GET /api/workspaces
 * Lista los workspaces del usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getWorkspacesForUser } from '@/lib/services/workspace-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get('accessToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const workspaces = await getWorkspacesForUser(payload.sub);

    return NextResponse.json({
      workspaces: workspaces.map((ws) => ({
        id: ws.workspace_id,
        name: ws.name,
        slug: ws.slug,
        logoUrl: ws.logo_url,
        brandColor: ws.brand_color,
        description: ws.description,
        role: ws.iris_role,
        sofiaRole: ws.sofia_role,
      })),
    });
  } catch (error) {
    console.error('[API /workspaces] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
