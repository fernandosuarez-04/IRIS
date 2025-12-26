-- =====================================================
-- IRIS - Sistema de Gestión de Flujos de Trabajo
-- Migration: 001_auth_system.sql
-- Descripción: Tablas de autenticación y gestión de usuarios
-- Fecha: 2024-12-24
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA: account_users
-- Descripción: Información principal de usuarios del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.account_users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información personal
  first_name VARCHAR(100) NOT NULL,
  last_name_paternal VARCHAR(100) NOT NULL,
  last_name_maternal VARCHAR(100),
  display_name VARCHAR(200),
  
  -- Credenciales
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  
  -- Roles y permisos
  permission_level VARCHAR(50) NOT NULL DEFAULT 'user' 
    CHECK (permission_level IN ('super_admin', 'admin', 'manager', 'user', 'viewer', 'guest')),
  company_role VARCHAR(100),
  department VARCHAR(100),
  
  -- Estado de la cuenta
  account_status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'inactive', 'suspended', 'pending_verification', 'deleted')),
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  
  -- Información adicional
  avatar_url TEXT,
  phone_number VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  locale VARCHAR(10) DEFAULT 'es-MX',
  
  -- Auditoría
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Restricciones adicionales
  CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT chk_username_format CHECK (username ~* '^[A-Za-z0-9_-]{3,50}$'),
  CONSTRAINT chk_password_hash CHECK (password_hash IS NOT NULL AND LENGTH(password_hash) > 0)
);

-- Índices para búsquedas optimizadas
CREATE INDEX idx_account_users_email ON public.account_users(email);
CREATE INDEX idx_account_users_username ON public.account_users(username);
CREATE INDEX idx_account_users_permission_level ON public.account_users(permission_level);
CREATE INDEX idx_account_users_account_status ON public.account_users(account_status);
CREATE INDEX idx_account_users_company_role ON public.account_users(company_role);

-- =====================================================
-- TABLA: auth_sessions
-- Descripción: Gestión de sesiones activas de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  
  -- Información del token
  token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT UNIQUE,
  
  -- Metadatos de la sesión
  device_fingerprint TEXT,
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  operating_system VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Geolocalización (opcional)
  geo_country VARCHAR(100),
  geo_city VARCHAR(100),
  
  -- Estado y tiempos
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Timestamps
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token_hash ON public.auth_sessions(token_hash);
CREATE INDEX idx_auth_sessions_is_active ON public.auth_sessions(is_active);
CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);

-- =====================================================
-- TABLA: auth_refresh_tokens
-- Descripción: Tokens de actualización para renovar sesiones
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_refresh_tokens (
  token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.auth_sessions(session_id) ON DELETE CASCADE,
  
  -- Token
  token_hash TEXT NOT NULL UNIQUE,
  token_family UUID NOT NULL DEFAULT uuid_generate_v4(), -- Para detectar reutilización
  
  -- Metadatos
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Estado
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Timestamps
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auth_refresh_tokens_user_id ON public.auth_refresh_tokens(user_id);
CREATE INDEX idx_auth_refresh_tokens_token_hash ON public.auth_refresh_tokens(token_hash);
CREATE INDEX idx_auth_refresh_tokens_token_family ON public.auth_refresh_tokens(token_family);
CREATE INDEX idx_auth_refresh_tokens_expires_at ON public.auth_refresh_tokens(expires_at);

-- =====================================================
-- TABLA: auth_password_resets
-- Descripción: Tokens para restablecimiento de contraseña
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_password_resets (
  reset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  
  -- Token
  token_hash TEXT NOT NULL UNIQUE,
  
  -- Metadatos de solicitud
  ip_address INET,
  user_agent TEXT,
  
  -- Estado
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auth_password_resets_user_id ON public.auth_password_resets(user_id);
CREATE INDEX idx_auth_password_resets_token_hash ON public.auth_password_resets(token_hash);
CREATE INDEX idx_auth_password_resets_expires_at ON public.auth_password_resets(expires_at);

-- =====================================================
-- TABLA: auth_email_verifications
-- Descripción: Tokens para verificación de correo electrónico
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_email_verifications (
  verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  
  -- Email a verificar
  email VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  
  -- Estado
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auth_email_verifications_user_id ON public.auth_email_verifications(user_id);
CREATE INDEX idx_auth_email_verifications_token_hash ON public.auth_email_verifications(token_hash);

-- =====================================================
-- TABLA: auth_login_history
-- Descripción: Historial de intentos de inicio de sesión
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_login_history (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.account_users(user_id) ON DELETE SET NULL,
  
  -- Credencial usada
  login_identifier VARCHAR(255) NOT NULL, -- email o username usado
  
  -- Resultado
  login_status VARCHAR(30) NOT NULL 
    CHECK (login_status IN ('success', 'failed_password', 'failed_user_not_found', 'account_locked', 'account_suspended', 'mfa_required', 'mfa_failed')),
  failure_reason TEXT,
  
  -- Metadatos del intento
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  geo_country VARCHAR(100),
  geo_city VARCHAR(100),
  
  -- Timestamp
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auth_login_history_user_id ON public.auth_login_history(user_id);
CREATE INDEX idx_auth_login_history_login_identifier ON public.auth_login_history(login_identifier);
CREATE INDEX idx_auth_login_history_attempted_at ON public.auth_login_history(attempted_at);
CREATE INDEX idx_auth_login_history_ip_address ON public.auth_login_history(ip_address);

-- =====================================================
-- TABLA: auth_oauth_providers
-- Descripción: Cuentas OAuth vinculadas (Google, Microsoft, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_oauth_providers (
  oauth_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  
  -- Proveedor
  provider_name VARCHAR(50) NOT NULL CHECK (provider_name IN ('google', 'microsoft', 'github', 'linkedin', 'apple')),
  provider_user_id VARCHAR(255) NOT NULL,
  
  -- Tokens (encriptados)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Información del perfil del proveedor
  provider_email VARCHAR(255),
  provider_display_name VARCHAR(255),
  provider_avatar_url TEXT,
  
  -- Scope y permisos
  granted_scopes TEXT[],
  
  -- Timestamps
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Restricción única por proveedor
  CONSTRAINT unique_oauth_provider_user UNIQUE (provider_name, provider_user_id)
);

-- Índices
CREATE INDEX idx_auth_oauth_providers_user_id ON public.auth_oauth_providers(user_id);
CREATE INDEX idx_auth_oauth_providers_provider ON public.auth_oauth_providers(provider_name, provider_user_id);

-- =====================================================
-- TABLA: user_permissions
-- Descripción: Permisos específicos por usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
  permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  
  -- Permiso
  permission_key VARCHAR(100) NOT NULL,
  permission_value JSONB DEFAULT '{}'::jsonb,
  
  -- Origen del permiso
  granted_by UUID REFERENCES public.account_users(user_id),
  granted_reason TEXT,
  
  -- Temporalidad
  is_temporary BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Único por usuario y permiso
  CONSTRAINT unique_user_permission UNIQUE (user_id, permission_key)
);

-- Índices
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_key ON public.user_permissions(permission_key);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER trigger_account_users_updated_at
  BEFORE UPDATE ON public.account_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auth_oauth_providers_updated_at
  BEFORE UPDATE ON public.auth_oauth_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Incrementar intentos fallidos y bloquear cuenta
-- =====================================================
CREATE OR REPLACE FUNCTION handle_failed_login(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER := 5;
  v_lockout_minutes INTEGER := 15;
BEGIN
  -- Incrementar intentos fallidos
  UPDATE public.account_users 
  SET failed_login_attempts = failed_login_attempts + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING failed_login_attempts INTO v_attempts;
  
  -- Si alcanza el máximo, bloquear cuenta
  IF v_attempts >= v_max_attempts THEN
    UPDATE public.account_users 
    SET locked_until = NOW() + (v_lockout_minutes || ' minutes')::INTERVAL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Resetear intentos fallidos tras login exitoso
-- =====================================================
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.account_users 
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE public.account_users IS 'Tabla principal de usuarios del sistema IRIS';
COMMENT ON TABLE public.auth_sessions IS 'Sesiones activas de usuarios con información de dispositivo';
COMMENT ON TABLE public.auth_refresh_tokens IS 'Tokens de actualización para renovar sesiones JWT';
COMMENT ON TABLE public.auth_password_resets IS 'Solicitudes de restablecimiento de contraseña';
COMMENT ON TABLE public.auth_email_verifications IS 'Verificaciones de correo electrónico pendientes';
COMMENT ON TABLE public.auth_login_history IS 'Historial detallado de intentos de inicio de sesión';
COMMENT ON TABLE public.auth_oauth_providers IS 'Cuentas OAuth vinculadas (Google, Microsoft, etc.)';
COMMENT ON TABLE public.user_permissions IS 'Permisos específicos asignados a usuarios';

COMMENT ON COLUMN public.account_users.permission_level IS 'Nivel de permisos: super_admin, admin, manager, user, viewer, guest';
COMMENT ON COLUMN public.account_users.company_role IS 'Rol del usuario dentro de la empresa (ej: Desarrollador, Gerente, etc.)';
COMMENT ON COLUMN public.account_users.password_hash IS 'Contraseña hasheada con bcrypt';

-- =====================================================
-- NOTA: Este sistema NO usa Row Level Security (RLS)
-- La seguridad se maneja a nivel de aplicación usando
-- el service_role key de Supabase
-- =====================================================
