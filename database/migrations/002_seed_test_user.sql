-- =====================================================
-- IRIS - Seed: Usuario de prueba
-- Migration: 002_seed_test_user.sql
-- =====================================================

-- IMPORTANTE: Ejecutar DESPUÉS de 001_auth_system.sql
-- La contraseña '220626EaFy' está hasheada con bcrypt

INSERT INTO public.account_users (
  first_name,
  last_name_paternal,
  last_name_maternal,
  display_name,
  username,
  email,
  password_hash,
  permission_level,
  company_role,
  department,
  account_status,
  is_email_verified,
  email_verified_at,
  timezone,
  locale,
  created_at,
  updated_at
) VALUES (
  'Fernando',
  'Suarez',
  'Gonzalez',
  'Fernando Suarez',
  'fernando_suarez',
  'fernando.suarez@ecosdeliderazgo.com',
  -- Contraseña: 220626EaFy (hasheada con bcrypt, cost 12)
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4OJYV.X3HKV1yU3e',
  'super_admin',
  'CEO',
  'Dirección General',
  'active',
  true,
  NOW(),
  'America/Mexico_City',
  'es-MX',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name_paternal = EXCLUDED.last_name_paternal,
  last_name_maternal = EXCLUDED.last_name_maternal,
  updated_at = NOW();

-- Verificar que el usuario fue creado
-- SELECT user_id, email, display_name, permission_level FROM public.account_users;
