/**
 * API Route: POST /api/auth/change-password
 * Permite al usuario cambiar su contraseña
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
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
    const { currentPassword, newPassword, confirmPassword } = body;

    // 3. Validar campos requeridos
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }

    // 4. Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: 'Las contraseñas nuevas no coinciden' 
      }, { status: 400 });
    }

    // 5. Validar longitud mínima
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'La contraseña debe tener al menos 8 caracteres' 
      }, { status: 400 });
    }

    // 6. Validar complejidad básica
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json({ 
        error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' 
      }, { status: 400 });
    }

    // 7. Obtener usuario actual
    const { data: user, error: userError } = await supabaseAdmin
      .from('account_users')
      .select('user_id, password_hash')
      .eq('user_id', payload.sub)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 8. Verificar contraseña actual
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'La contraseña actual es incorrecta' 
      }, { status: 400 });
    }

    // 9. Verificar que la nueva contraseña sea diferente
    const isSamePassword = await verifyPassword(newPassword, user.password_hash);
    if (isSamePassword) {
      return NextResponse.json({ 
        error: 'La nueva contraseña debe ser diferente a la actual' 
      }, { status: 400 });
    }

    // 10. Hash de la nueva contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // 11. Actualizar en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('account_users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', payload.sub);

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      return NextResponse.json({ 
        error: 'Error al actualizar la contraseña' 
      }, { status: 500 });
    }

    // 12. Retornar éxito
    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en POST /api/auth/change-password:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
