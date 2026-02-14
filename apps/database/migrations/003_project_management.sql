-- =====================================================
-- IRIS - Sistema de Gestión de Flujos de Trabajo
-- Migration: 003_project_management.sql
-- Descripción: Tablas para gestión de proyectos estilo Linear
-- Fecha: 2024-12-25
-- =====================================================

-- =====================================================
-- TABLA: pm_projects
-- Descripción: Proyectos principales del sistema
-- Nota: Usa la tabla existente 'teams' para relaciones de equipo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pm_projects (
  project_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Identificación
  project_key character varying(20) NOT NULL UNIQUE, -- Ej: 'IRIS-001', 'PROJ-042'
  project_name character varying(255) NOT NULL,
  project_description text,
  
  -- Iconografía y visualización
  icon_name character varying(50) DEFAULT 'folder', -- Nombre del icono (ej: 'folder', 'rocket', 'target')
  icon_color character varying(7) DEFAULT '#3B82F6', -- Color hexadecimal
  cover_image_url text,
  
  -- Estado y salud del proyecto
  project_status character varying(30) NOT NULL DEFAULT 'planning'
    CHECK (project_status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived')),
  health_status character varying(20) NOT NULL DEFAULT 'none'
    CHECK (health_status IN ('on_track', 'at_risk', 'off_track', 'none')),
  
  -- Prioridad
  priority_level character varying(20) NOT NULL DEFAULT 'medium'
    CHECK (priority_level IN ('urgent', 'high', 'medium', 'low', 'none')),
  
  -- Progreso
  completion_percentage integer NOT NULL DEFAULT 0
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Fechas clave
  start_date date,
  target_date date,
  actual_end_date date,
  
  -- Relaciones (usa tabla teams existente)
  team_id uuid,
  lead_user_id uuid,
  created_by_user_id uuid NOT NULL,
  
  -- Configuración
  is_public boolean NOT NULL DEFAULT false,
  is_template boolean NOT NULL DEFAULT false,
  allow_external_access boolean NOT NULL DEFAULT false,
  
  -- Metadatos
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_at timestamp with time zone,
  
  -- Constraints
  CONSTRAINT pm_projects_pkey PRIMARY KEY (project_id),
  CONSTRAINT pm_projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE SET NULL,
  CONSTRAINT pm_projects_lead_user_id_fkey FOREIGN KEY (lead_user_id) REFERENCES public.account_users(user_id) ON DELETE SET NULL,
  CONSTRAINT pm_projects_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.account_users(user_id) ON DELETE RESTRICT,
  CONSTRAINT chk_project_dates CHECK (
    (start_date IS NULL OR target_date IS NULL) OR start_date <= target_date
  )
);

-- Índices para búsquedas optimizadas
CREATE INDEX IF NOT EXISTS idx_pm_projects_project_key ON public.pm_projects(project_key);
CREATE INDEX IF NOT EXISTS idx_pm_projects_project_status ON public.pm_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_pm_projects_health_status ON public.pm_projects(health_status);
CREATE INDEX IF NOT EXISTS idx_pm_projects_priority_level ON public.pm_projects(priority_level);
CREATE INDEX IF NOT EXISTS idx_pm_projects_team_id ON public.pm_projects(team_id);
CREATE INDEX IF NOT EXISTS idx_pm_projects_lead_user_id ON public.pm_projects(lead_user_id);
CREATE INDEX IF NOT EXISTS idx_pm_projects_target_date ON public.pm_projects(target_date);
CREATE INDEX IF NOT EXISTS idx_pm_projects_created_at ON public.pm_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_pm_projects_tags ON public.pm_projects USING GIN(tags);

-- =====================================================
-- TABLA: pm_project_members
-- Descripción: Miembros asignados a proyectos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pm_project_members (
  member_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  
  -- Rol en el proyecto
  project_role character varying(30) NOT NULL DEFAULT 'member'
    CHECK (project_role IN ('owner', 'admin', 'member', 'viewer', 'guest')),
  
  -- Permisos específicos
  can_edit boolean NOT NULL DEFAULT true,
  can_delete boolean NOT NULL DEFAULT false,
  can_manage_members boolean NOT NULL DEFAULT false,
  can_manage_settings boolean NOT NULL DEFAULT false,
  
  -- Notificaciones
  notification_preference character varying(20) DEFAULT 'all'
    CHECK (notification_preference IN ('all', 'mentions', 'important', 'none')),
  
  -- Auditoría
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  invited_by_user_id uuid,
  
  -- Constraints
  CONSTRAINT pm_project_members_pkey PRIMARY KEY (member_id),
  CONSTRAINT pm_project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pm_projects(project_id) ON DELETE CASCADE,
  CONSTRAINT pm_project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  CONSTRAINT pm_project_members_invited_by_fkey FOREIGN KEY (invited_by_user_id) REFERENCES public.account_users(user_id) ON DELETE SET NULL,
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pm_project_members_project_id ON public.pm_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_members_user_id ON public.pm_project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_members_project_role ON public.pm_project_members(project_role);

-- =====================================================
-- TABLA: pm_project_progress_history
-- Descripción: Historial de progreso para sparklines
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pm_project_progress_history (
  history_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  
  -- Datos del progreso
  completion_percentage integer NOT NULL
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Contadores de tareas (snapshot)
  total_tasks integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  in_progress_tasks integer DEFAULT 0,
  blocked_tasks integer DEFAULT 0,
  
  -- Timestamp
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT pm_project_progress_history_pkey PRIMARY KEY (history_id),
  CONSTRAINT pm_project_progress_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pm_projects(project_id) ON DELETE CASCADE,
  CONSTRAINT unique_project_progress_moment UNIQUE (project_id, recorded_at)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pm_project_progress_history_project_id ON public.pm_project_progress_history(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_progress_history_recorded_at ON public.pm_project_progress_history(recorded_at);

-- =====================================================
-- TABLA: pm_project_views
-- Descripción: Vistas personalizadas de proyectos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pm_project_views (
  view_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Propietario de la vista
  user_id uuid,
  team_id uuid,
  
  -- Información de la vista
  view_name character varying(100) NOT NULL,
  view_description text,
  view_type character varying(30) NOT NULL DEFAULT 'list'
    CHECK (view_type IN ('list', 'board', 'timeline', 'calendar', 'table')),
  
  -- Configuración de la vista
  filters jsonb DEFAULT '{}'::jsonb,
  sort_config jsonb DEFAULT '{"field": "created_at", "direction": "desc"}'::jsonb,
  columns_config jsonb DEFAULT '[]'::jsonb,
  group_by character varying(50),
  
  -- Visibilidad
  is_default boolean NOT NULL DEFAULT false,
  is_shared boolean NOT NULL DEFAULT false,
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT pm_project_views_pkey PRIMARY KEY (view_id),
  CONSTRAINT pm_project_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  CONSTRAINT pm_project_views_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE,
  CONSTRAINT chk_view_owner CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pm_project_views_user_id ON public.pm_project_views(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_views_team_id ON public.pm_project_views(team_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_views_view_type ON public.pm_project_views(view_type);

-- =====================================================
-- TABLA: pm_milestones
-- Descripción: Hitos de proyectos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pm_milestones (
  milestone_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  
  -- Información del hito
  milestone_name character varying(255) NOT NULL,
  milestone_description text,
  
  -- Estado
  milestone_status character varying(30) NOT NULL DEFAULT 'pending'
    CHECK (milestone_status IN ('pending', 'in_progress', 'completed', 'missed', 'cancelled')),
  
  -- Fechas
  target_date date NOT NULL,
  completed_date date,
  
  -- Orden
  sort_order integer NOT NULL DEFAULT 0,
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT pm_milestones_pkey PRIMARY KEY (milestone_id),
  CONSTRAINT pm_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pm_projects(project_id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pm_milestones_project_id ON public.pm_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_milestones_milestone_status ON public.pm_milestones(milestone_status);
CREATE INDEX IF NOT EXISTS idx_pm_milestones_target_date ON public.pm_milestones(target_date);

-- =====================================================
-- TABLA: pm_project_updates
-- Descripción: Actualizaciones/notas del proyecto
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pm_project_updates (
  update_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  
  -- Contenido
  update_title character varying(255),
  update_content text NOT NULL,
  update_type character varying(30) NOT NULL DEFAULT 'general'
    CHECK (update_type IN ('general', 'status', 'milestone', 'blocker', 'decision', 'celebration')),
  
  -- Estado de salud al momento de la actualización
  health_status_snapshot character varying(20)
    CHECK (health_status_snapshot IN ('on_track', 'at_risk', 'off_track', 'none')),
  completion_percentage_snapshot integer,
  
  -- Visibilidad
  is_pinned boolean NOT NULL DEFAULT false,
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  edited_at timestamp with time zone,
  
  -- Constraints
  CONSTRAINT pm_project_updates_pkey PRIMARY KEY (update_id),
  CONSTRAINT pm_project_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pm_projects(project_id) ON DELETE CASCADE,
  CONSTRAINT pm_project_updates_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES public.account_users(user_id) ON DELETE RESTRICT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pm_project_updates_project_id ON public.pm_project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_updates_author_user_id ON public.pm_project_updates(author_user_id);
CREATE INDEX IF NOT EXISTS idx_pm_project_updates_created_at ON public.pm_project_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_pm_project_updates_update_type ON public.pm_project_updates(update_type);

-- =====================================================
-- TRIGGERS: Actualizar updated_at automáticamente
-- =====================================================
DROP TRIGGER IF EXISTS trigger_pm_projects_updated_at ON public.pm_projects;
CREATE TRIGGER trigger_pm_projects_updated_at
  BEFORE UPDATE ON public.pm_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pm_project_views_updated_at ON public.pm_project_views;
CREATE TRIGGER trigger_pm_project_views_updated_at
  BEFORE UPDATE ON public.pm_project_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pm_milestones_updated_at ON public.pm_milestones;
CREATE TRIGGER trigger_pm_milestones_updated_at
  BEFORE UPDATE ON public.pm_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pm_project_updates_updated_at ON public.pm_project_updates;
CREATE TRIGGER trigger_pm_project_updates_updated_at
  BEFORE UPDATE ON public.pm_project_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Registrar progreso automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION record_project_progress(p_project_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.pm_project_progress_history (
    project_id,
    completion_percentage,
    recorded_at
  )
  SELECT 
    project_id,
    completion_percentage,
    NOW()
  FROM public.pm_projects
  WHERE project_id = p_project_id
  ON CONFLICT (project_id, recorded_at) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Obtener datos de sparkline para un proyecto
-- =====================================================
CREATE OR REPLACE FUNCTION get_project_sparkline_data(
  p_project_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  recorded_at timestamp with time zone,
  completion_percentage integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.recorded_at,
    h.completion_percentage
  FROM public.pm_project_progress_history h
  WHERE h.project_id = p_project_id
    AND h.recorded_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY h.recorded_at ASC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: Proyectos con información calculada
-- Usa tabla 'teams' existente
-- =====================================================
CREATE OR REPLACE VIEW public.v_projects_summary AS
SELECT 
  p.project_id,
  p.project_key,
  p.project_name,
  p.project_description,
  p.icon_name,
  p.icon_color,
  p.project_status,
  p.health_status,
  p.priority_level,
  p.completion_percentage,
  p.start_date,
  p.target_date,
  p.actual_end_date,
  p.team_id,
  p.lead_user_id,
  p.created_at,
  p.updated_at,
  p.tags,
  -- Información del líder
  u.first_name AS lead_first_name,
  u.last_name_paternal AS lead_last_name,
  u.display_name AS lead_display_name,
  u.avatar_url AS lead_avatar_url,
  -- Información del equipo (usa tabla teams existente)
  t.name AS team_name,
  t.color AS team_color,
  -- Contadores
  (SELECT COUNT(*) FROM public.pm_project_members pm WHERE pm.project_id = p.project_id) AS member_count,
  (SELECT COUNT(*) FROM public.pm_milestones m WHERE m.project_id = p.project_id) AS milestone_count
FROM public.pm_projects p
LEFT JOIN public.account_users u ON p.lead_user_id = u.user_id
LEFT JOIN public.teams t ON p.team_id = t.team_id
WHERE p.project_status != 'archived';

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE public.pm_projects IS 'Proyectos principales del sistema de gestión';
COMMENT ON TABLE public.pm_project_members IS 'Miembros asignados a cada proyecto con roles y permisos';
COMMENT ON TABLE public.pm_project_progress_history IS 'Historial de progreso para generar gráficos sparkline';
COMMENT ON TABLE public.pm_project_views IS 'Vistas personalizadas de proyectos por usuario o equipo';
COMMENT ON TABLE public.pm_milestones IS 'Hitos importantes dentro de cada proyecto';
COMMENT ON TABLE public.pm_project_updates IS 'Actualizaciones y notas de estado del proyecto';

COMMENT ON COLUMN public.pm_projects.project_key IS 'Identificador único legible (ej: IRIS-001)';
COMMENT ON COLUMN public.pm_projects.health_status IS 'Estado de salud: on_track (verde), at_risk (amarillo), off_track (rojo), none';
COMMENT ON COLUMN public.pm_projects.priority_level IS 'Nivel de prioridad: urgent, high, medium, low, none';
COMMENT ON COLUMN public.pm_projects.completion_percentage IS 'Porcentaje de completado (0-100)';
COMMENT ON COLUMN public.pm_project_progress_history.completion_percentage IS 'Snapshot del porcentaje para sparkline';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
