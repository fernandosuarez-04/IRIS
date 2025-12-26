/**
 * API Route: POST /api/auth/login
 * Maneja el inicio de sesión de usuarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, AccountUser } from '@/lib/supabase/server';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokenPair, hashToken } from '@/lib/auth/jwt';

// Forzar runtime de Node.js para compatibilidad con bcrypt
export const runtime = 'nodejs';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'guest';
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario por email o username
    const { data: user, error: userError } = await supabaseAdmin
      .from('account_users')
      .select('*')
      .or(`email.eq.${email},username.eq.${email}`)
      .single();

    // Registrar intento de login
    const loginLog: {
      login_identifier: string;
      ip_address: string | null;
      user_agent: string | null;
      login_status: 'success' | 'failed_password' | 'failed_user_not_found' | 'account_locked' | 'account_suspended' | 'mfa_required' | 'mfa_failed';
      user_id: string | null;
    } = {
      login_identifier: email,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      user_agent: request.headers.get('user-agent') || null,
      login_status: 'failed_user_not_found',
      user_id: null,
    };

    if (userError || !user) {
      // Usuario no encontrado
      await supabaseAdmin.from('auth_login_history').insert(loginLog);
      
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const accountUser = user as AccountUser;
    loginLog.user_id = accountUser.user_id;

    // Verificar si la cuenta está bloqueada
    if (accountUser.locked_until) {
      const lockTime = new Date(accountUser.locked_until);
      if (lockTime > new Date()) {
        loginLog.login_status = 'account_locked';
        await supabaseAdmin.from('auth_login_history').insert(loginLog);
        
        return NextResponse.json(
          { error: 'Cuenta bloqueada temporalmente. Intenta más tarde.' },
          { status: 423 }
        );
      }
    }

    // Verificar estado de la cuenta
    if (accountUser.account_status !== 'active') {
      loginLog.login_status = 'account_suspended';
      await supabaseAdmin.from('auth_login_history').insert(loginLog);
      
      return NextResponse.json(
        { error: `Cuenta ${accountUser.account_status}. Contacta al administrador.` },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, accountUser.password_hash);

    if (!isPasswordValid) {
      loginLog.login_status = 'failed_password';
      await supabaseAdmin.from('auth_login_history').insert(loginLog);
      
      // Incrementar intentos fallidos
      await supabaseAdmin.rpc('handle_failed_login', { p_user_id: accountUser.user_id });
      
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Login exitoso - Generar tokens
    const tokens = await generateTokenPair(accountUser);

    // Crear sesión en la base de datos
    const sessionData = {
      user_id: accountUser.user_id,
      token_hash: await hashToken(tokens.accessToken),
      refresh_token_hash: await hashToken(tokens.refreshToken),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      user_agent: request.headers.get('user-agent') || null,
      device_type: detectDeviceType(request.headers.get('user-agent') || ''),
      browser_name: detectBrowser(request.headers.get('user-agent') || ''),
      expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      is_active: true,
    };

    await supabaseAdmin.from('auth_sessions').insert(sessionData);

    // Registrar login exitoso
    loginLog.login_status = 'success';
    await supabaseAdmin.from('auth_login_history').insert(loginLog);

    // Resetear intentos fallidos
    await supabaseAdmin.rpc('reset_failed_login_attempts', { p_user_id: accountUser.user_id });

    // Mapear usuario al formato esperado por el frontend
    const responseUser = {
      id: accountUser.user_id,
      email: accountUser.email,
      name: accountUser.display_name || `${accountUser.first_name} ${accountUser.last_name_paternal}`,
      role: mapPermissionToRole(accountUser.permission_level),
      avatar: accountUser.avatar_url || undefined,
      createdAt: new Date(accountUser.created_at),
      updatedAt: new Date(accountUser.updated_at),
    };

    const response: LoginResponse = {
      user: responseUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Mapea permission_level a rol simple del frontend
 */
function mapPermissionToRole(level: string): 'admin' | 'user' | 'guest' {
  switch (level) {
    case 'super_admin':
    case 'admin':
      return 'admin';
    case 'manager':
    case 'user':
      return 'user';
    case 'viewer':
    case 'guest':
    default:
      return 'guest';
  }
}

/**
 * Detecta el tipo de dispositivo desde User-Agent
 */
function detectDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

/**
 * Detecta el navegador desde User-Agent
 */
function detectBrowser(userAgent: string): string {
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  return 'Unknown';
}
