-- ARIA Multimodal Support
-- 1. Table to track attachments sent to ARIA
CREATE TABLE public.aria_chat_attachments (
  attachment_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  team_id uuid, -- Optional, for team context
  file_name text NOT NULL,
  file_type text NOT NULL, -- MIME type
  file_size integer,
  storage_path text NOT NULL, -- Path in Supabase Storage
  public_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aria_chat_attachments_pkey PRIMARY KEY (attachment_id),
  CONSTRAINT aria_chat_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.account_users(user_id)
);

-- 2. Security
-- Como no se utiliza Supabase Auth nativo, delegamos la seguridad a la capa de aplicación (API)
-- Habilitamos RLS por buenas prácticas, pero sin políticas vinculadas a auth.uid()
ALTER TABLE public.aria_chat_attachments ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso total al rol de servicio (backend)
-- El backend usa 'postgres' o 'service_role', que hacen bypass de RLS por defecto, 
-- pero es bueno ser explícito si se crean usuarios de base de datos personalizados.

-- (Opcional) Si necesitas acceso público de lectura para mostrar imágenes:
-- CREATE POLICY "Allow public read access" ON public.aria_chat_attachments FOR SELECT USING (true);


-- INSTRUCCIONES MANUALES PARA STORAGE (Sin Auth de Supabase):
-- 1. Ve a Supabase Dashboard -> Storage
-- 2. Crea un nuevo bucket llamado 'aria-attachments'
-- 3. IMPORTANTE: Hazlo "Public Bucket".
--    Al ser público, cualquier persona con la URL puede ver la imagen.
--    Esto es necesario si no usas los tokens de Supabase Auth para validar la descarga.
--    
--    Si necesitas privacidad total, el bucket debe ser privado y tu backend debe 
--    generar URLs firmadas (Signed URLs) para que el frontend las muestre.
