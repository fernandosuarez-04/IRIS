/**
 * API Route: POST /api/auth/refresh
 * Renueva los tokens de acceso usando el refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken, generateTokenPair, hashToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

interface RefreshRequest {
  refreshToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshRequest = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token requerido' },
        { status: 400 }
      );
    }

    // Verificar el refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Refresh token inválido o expirado' },
        { status: 401 }
      );
    }

    // Verificar que sea un refresh token
    if (payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Tipo de token inválido' },
        { status: 401 }
      );
    }

    // Buscar el usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from('account_users')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la cuenta siga activa
    if (user.account_status !== 'active') {
      return NextResponse.json(
        { error: 'Cuenta no activa' },
        { status: 403 }
      );
    }

    // Generar nuevos tokens
    const tokens = await generateTokenPair(user);

    // Revocar la sesión anterior
    const oldTokenHash = await hashToken(refreshToken);
    await supabaseAdmin
      .from('auth_sessions')
      .update({
        is_active: false,
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'Token refreshed',
      })
      .eq('refresh_token_hash', oldTokenHash);

    // Crear nueva sesión
    const sessionData = {
      user_id: user.user_id,
      token_hash: await hashToken(tokens.accessToken),
      refresh_token_hash: await hashToken(tokens.refreshToken),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      user_agent: request.headers.get('user-agent') || null,
      expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      is_active: true,
    };

    await supabaseAdmin.from('auth_sessions').insert(sessionData);

    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });

  } catch (error) {
    console.error('Error en refresh:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
