/**
 * API Route: POST /api/upload/avatar
 * Sube una imagen de avatar para el usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

// Configurar para manejar archivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
};

const BUCKET_NAME = 'user-avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

    const userId = payload.sub;

    // 2. Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // 3. Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido. Usa: JPG, PNG, GIF o WebP' 
      }, { status: 400 });
    }

    // 4. Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 5MB' 
      }, { status: 400 });
    }

    // 5. Preparar el archivo para subida
    const fileBuffer = await file.arrayBuffer();
    const fileExtension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const fileName = `avatar.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // 6. Eliminar avatar anterior si existe (para evitar acumulación)
    try {
      const { data: existingFiles } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from(BUCKET_NAME).remove(filesToDelete);
      }
    } catch (e) {
      // Ignorar errores de limpieza
      console.log('No se pudieron limpiar avatares anteriores:', e);
    }

    // 7. Subir el nuevo avatar
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true, // Sobrescribir si existe
      });

    if (error) {
      console.error('Error subiendo avatar:', error);
      return NextResponse.json({ 
        error: 'Error al subir la imagen',
        details: error.message 
      }, { status: 500 });
    }

    // 8. Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // 9. Actualizar el avatar_url en la tabla account_users
    const { error: updateError } = await supabaseAdmin
      .from('account_users')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return NextResponse.json({ 
        error: 'Imagen subida pero no se pudo actualizar el perfil',
        avatarUrl // Devolver la URL de todos modos
      }, { status: 207 }); // Multi-Status
    }

    // 10. Retornar éxito
    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'Avatar actualizado correctamente'
    });

  } catch (error) {
    console.error('Error en POST /api/upload/avatar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar avatar
export async function DELETE(request: NextRequest) {
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

    const userId = payload.sub;

    // 2. Listar y eliminar archivos del usuario
    const { data: existingFiles } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabaseAdmin.storage.from(BUCKET_NAME).remove(filesToDelete);
    }

    // 3. Limpiar avatar_url en la base de datos
    await supabaseAdmin
      .from('account_users')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return NextResponse.json({ success: true, message: 'Avatar eliminado' });

  } catch (error) {
    console.error('Error en DELETE /api/upload/avatar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
