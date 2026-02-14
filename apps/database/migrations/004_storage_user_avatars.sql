-- ============================================================================
-- SUPABASE STORAGE: Bucket para Avatares de Usuario
-- ============================================================================
-- 
-- INSTRUCCIONES PARA CREAR EL BUCKET:
-- 
-- 1. Ve al Dashboard de Supabase: https://app.supabase.com
-- 2. Selecciona tu proyecto
-- 3. Ve a "Storage" en el menú lateral
-- 4. Click en "New bucket"
-- 5. Configura:
--    - Name: user-avatars
--    - Public bucket: YES (para que las imágenes sean accesibles públicamente)
--    - File size limit: 5MB (5242880 bytes)
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- O usa el siguiente código SQL para crear el bucket (requiere permisos de admin):
-- ============================================================================

-- Crear el bucket (si usas SQL - alternativa al dashboard)
-- Nota: Esto requiere que tengas acceso a la API de Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars', 
  true,  -- Bucket público para que las URLs de avatar sean accesibles
  5242880,  -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- POLÍTICAS DE ACCESO (RLS)
-- ============================================================================
-- Dado que NO usamos la autenticación de Supabase, usaremos el service_role
-- para todas las operaciones de storage. Sin embargo, definimos políticas
-- para casos futuros donde se requiera acceso desde el cliente.

-- Política: Permitir lectura pública de avatares
CREATE POLICY "Avatares son públicos para lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Política: Solo el service_role puede insertar/actualizar/eliminar
-- (No necesitamos política adicional porque usamos service_role key)

-- ============================================================================
-- ESTRUCTURA DE ARCHIVOS EN EL BUCKET
-- ============================================================================
-- 
-- Los archivos se organizarán de la siguiente manera:
-- 
-- user-avatars/
-- ├── {user_id}/
-- │   └── avatar.{extension}  -- Ej: avatar.jpg, avatar.png
-- 
-- Ejemplo de URL pública:
-- https://tu-proyecto.supabase.co/storage/v1/object/public/user-avatars/{user_id}/avatar.jpg
--
-- ============================================================================
