/**
 * API Route: GET /api/auth/me
 * Obtiene la información del usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Verificar que sea un access token
    if (payload.type !== 'access') {
      return NextResponse.json(
        { error: 'Tipo de token inválido' },
        { status: 401 }
      );
    }

    // Obtener datos actualizados del usuario
    const { data: user, error } = await supabaseAdmin
      .from('account_users')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar last_activity_at
    await supabaseAdmin
      .from('account_users')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('user_id', user.user_id);

    // Mapear respuesta
    const response = mapUserResponse(user);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en GET /auth/me:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 1. Verificación de token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 2. Leer body
    const body = await request.json();
    
    // 3. Filtrar campos permitidos para actualización
    const allowedFields = [
      'first_name',
      'last_name_paternal',
      'last_name_maternal',
      'display_name',
      'username',
      'phone_number',
      'company_role',
      'department',
      'timezone',
      'locale',
      'avatar_url'
    ];

    const updates: Record<string, any> = {};
    let hasUpdates = false;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No se enviaron campos válidos para actualizar' }, { status: 400 });
    }

    // Añadir timestamp de actualización
    updates.updated_at = new Date().toISOString();

    // 4. Actualizar en BD
    const { data: updatedUser, error } = await supabaseAdmin
      .from('account_users')
      .update(updates)
      .eq('user_id', payload.sub)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando usuario:', error);
      return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }

    // 5. Retornar respuesta mapeada
    return NextResponse.json(mapUserResponse(updatedUser));

  } catch (error) {
    console.error('Error en PATCH /auth/me:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function mapUserResponse(user: any) {
  return {
    id: user.user_id,
    email: user.email,
    username: user.username,
    name: user.display_name || `${user.first_name} ${user.last_name_paternal}`,
    firstName: user.first_name,
    lastName: `${user.last_name_paternal} ${user.last_name_maternal || ''}`.trim(),
    // Campos crudos adicionales para edición de perfil
    firstNameRaw: user.first_name,
    lastNamePaternal: user.last_name_paternal,
    lastNameMaternal: user.last_name_maternal || '',
    phoneNumber: user.phone_number || '',
    // Otros campos
    role: mapPermissionToRole(user.permission_level),
    permissionLevel: user.permission_level,
    companyRole: user.company_role,
    department: user.department,
    avatar: user.avatar_url,
    isEmailVerified: user.is_email_verified,
    timezone: user.timezone,
    locale: user.locale,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function mapPermissionToRole(level: string): 'admin' | 'user' | 'guest' {
  switch (level) {
    case 'super_admin':
    case 'admin':
      return 'admin';
    case 'manager':
    case 'user':
      return 'user';
    default:
      return 'guest';
  }
}
