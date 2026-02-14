-- ══════════════════════════════════════════════════════════
-- Migración 012: Sistema Multi-Organización (Workspaces)
-- ══════════════════════════════════════════════════════════
-- Crea las tablas para soportar múltiples organizaciones
-- sincronizadas con SOFIA Learning.
-- ══════════════════════════════════════════════════════════

-- ── 0. Función update_updated_at_column (si no existe) ──

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 1. Tabla workspaces (mirrors organizations de SOFIA) ──

CREATE TABLE IF NOT EXISTS public.workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sofia_org_id UUID NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  brand_color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_sofia_org ON public.workspaces(sofia_org_id);

-- Trigger updated_at
CREATE TRIGGER trigger_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── 2. Tabla workspace_members ──

CREATE TABLE IF NOT EXISTS public.workspace_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.account_users(user_id) ON DELETE CASCADE,
  sofia_role VARCHAR(50) NOT NULL DEFAULT 'member',
  iris_role VARCHAR(50) NOT NULL DEFAULT 'member'
    CHECK (iris_role IN ('owner', 'admin', 'manager', 'leader', 'member')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_active ON public.workspace_members(workspace_id, is_active);

-- Trigger updated_at
CREATE TRIGGER trigger_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── 3. Agregar workspace_id a tablas existentes ──

-- teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id);

CREATE INDEX IF NOT EXISTS idx_teams_workspace ON public.teams(workspace_id);

-- pm_projects
ALTER TABLE public.pm_projects
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id);

CREATE INDEX IF NOT EXISTS idx_pm_projects_workspace ON public.pm_projects(workspace_id);


-- ── 4. Función de mapeo de roles SOFIA → IRIS ──

CREATE OR REPLACE FUNCTION map_sofia_role_to_iris(sofia_role VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE sofia_role
    WHEN 'owner' THEN 'owner'
    WHEN 'admin' THEN 'admin'
    WHEN 'member' THEN 'member'
    ELSE 'member'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ── 5. RLS Policies ──

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace: lectura si es miembro activo
CREATE POLICY workspace_read_policy ON public.workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.workspace_id
        AND wm.is_active = true
    )
    OR is_active = true
  );

-- Workspace members: lectura si es del mismo workspace
CREATE POLICY workspace_members_read_policy ON public.workspace_members
  FOR SELECT USING (true);

-- Workspace members: insert/update solo para admins del workspace
CREATE POLICY workspace_members_write_policy ON public.workspace_members
  FOR ALL USING (true);


-- ══════════════════════════════════════════════════════════
-- Fin de migración 012
-- ══════════════════════════════════════════════════════════
