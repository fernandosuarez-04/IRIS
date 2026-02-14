/**
 * Workspace Service
 *
 * Sincroniza organizaciones de SOFIA con workspaces de IRIS
 * y provee queries para gestión de workspaces.
 */

import { getSupabaseAdmin } from '../supabase/server';

// ── Tipos ──

export interface Workspace {
  workspace_id: string;
  sofia_org_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  brand_color: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  member_id: string;
  workspace_id: string;
  user_id: string;
  sofia_role: string;
  iris_role: 'owner' | 'admin' | 'manager' | 'leader' | 'member';
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  iris_role: string;
  sofia_role: string;
}

interface SofiaOrgData {
  organization_id: string;
  role: string;
  status?: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    brand_logo_url?: string;
    brand_primary_color?: string;
    description?: string;
  };
}

// ── Funciones ──

/**
 * Mapea un rol de SOFIA al rol equivalente en IRIS
 */
function mapSofiaRoleToIris(sofiaRole: string): WorkspaceMember['iris_role'] {
  switch (sofiaRole) {
    case 'owner': return 'owner';
    case 'admin': return 'admin';
    case 'member': return 'member';
    default: return 'member';
  }
}

/**
 * Sincroniza las organizaciones de SOFIA con workspaces en IRIS.
 * Crea workspaces nuevos si no existen, actualiza info si cambió.
 * Crea/actualiza membresías del usuario.
 */
export async function syncWorkspacesFromSofia(
  irisUserId: string,
  sofiaOrgs: SofiaOrgData[]
): Promise<WorkspaceWithRole[]> {
  if (!sofiaOrgs || sofiaOrgs.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const results: WorkspaceWithRole[] = [];

  for (const orgUser of sofiaOrgs) {
    if (!orgUser.organizations || orgUser.status === 'removed') continue;

    const org = orgUser.organizations;
    const sofiaOrgId = org.id || orgUser.organization_id;

    try {
      // 1. Upsert workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .upsert(
          {
            sofia_org_id: sofiaOrgId,
            name: org.name,
            slug: org.slug,
            logo_url: org.logo_url || org.brand_logo_url || null,
            brand_color: org.brand_primary_color || '#3B82F6',
            description: org.description || null,
            is_active: true,
          },
          { onConflict: 'sofia_org_id' }
        )
        .select()
        .single();

      if (wsError) {
        console.error(`[WORKSPACE SERVICE] Error upserting workspace ${org.slug}:`, wsError.message);
        continue;
      }

      // 2. Upsert membership
      const irisRole = mapSofiaRoleToIris(orgUser.role || 'member');

      const { error: memberError } = await supabase
        .from('workspace_members')
        .upsert(
          {
            workspace_id: workspace.workspace_id,
            user_id: irisUserId,
            sofia_role: orgUser.role || 'member',
            iris_role: irisRole,
            is_active: true,
          },
          { onConflict: 'workspace_id,user_id' }
        );

      if (memberError) {
        console.error(`[WORKSPACE SERVICE] Error upserting member:`, memberError.message);
      }

      results.push({
        ...workspace,
        iris_role: irisRole,
        sofia_role: orgUser.role || 'member',
      });
    } catch (err) {
      console.error(`[WORKSPACE SERVICE] Error syncing org ${org.slug}:`, err);
    }
  }

  return results;
}

/**
 * Obtiene todos los workspaces de un usuario con sus roles
 */
export async function getWorkspacesForUser(userId: string): Promise<WorkspaceWithRole[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      sofia_role,
      iris_role,
      is_active,
      workspaces (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('[WORKSPACE SERVICE] Error fetching workspaces:', error.message);
    return [];
  }

  if (!data) return [];

  return data
    .filter((m: any) => m.workspaces && m.workspaces.is_active)
    .map((m: any) => ({
      ...m.workspaces,
      iris_role: m.iris_role,
      sofia_role: m.sofia_role,
    }));
}

/**
 * Obtiene un workspace por slug
 */
export async function getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[WORKSPACE SERVICE] Error fetching workspace by slug:', error.message);
    return null;
  }

  return data;
}

/**
 * Obtiene el rol de un usuario en un workspace específico
 */
export async function getUserWorkspaceRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[WORKSPACE SERVICE] Error fetching user role:', error.message);
    return null;
  }

  return data;
}

/**
 * Obtiene todos los miembros de un workspace
 */
export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      account_users (
        user_id,
        first_name,
        last_name_paternal,
        display_name,
        email,
        avatar_url,
        permission_level
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);

  if (error) {
    console.error('[WORKSPACE SERVICE] Error fetching members:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Actualiza el rol IRIS de un miembro
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: WorkspaceMember['iris_role']
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('workspace_members')
    .update({ iris_role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    console.error('[WORKSPACE SERVICE] Error updating role:', error.message);
    return false;
  }

  return true;
}
