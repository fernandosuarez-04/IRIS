-- ============================================================================
-- Global Search Function
-- Migration: 010_global_search.sql
-- Created: 2025-12-26
-- ============================================================================

CREATE OR REPLACE FUNCTION search_all(search_term TEXT)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    subtitle TEXT,
    url TEXT,
    avatar TEXT -- Optional extra field
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    -- 1. Projects
    (SELECT 
        p.project_id as id,
        'project'::text as type,
        p.project_name as title,
        p.project_key as subtitle,
        '/admin/projects/' || p.project_id as url,
        NULL::text as avatar
    FROM pm_projects p
    WHERE p.project_name ILIKE '%' || search_term || '%'
       OR p.project_key ILIKE '%' || search_term || '%'
    ORDER BY p.created_at DESC
    LIMIT 5)

    UNION ALL

    -- 2. Tasks
    (SELECT 
        t.issue_id as id,
        'task'::text as type,
        t.title as title,
        'Tarea #' || t.issue_number::text as subtitle,
        '/admin/projects/' || t.project_id || '?taskId=' || t.issue_id as url, -- Simplified URL
        NULL::text as avatar
    FROM task_issues t
    WHERE t.title ILIKE '%' || search_term || '%'
    ORDER BY t.created_at DESC
    LIMIT 5)

    UNION ALL

    -- 3. Users
    (SELECT 
        u.user_id as id,
        'user'::text as type,
        COALESCE(u.display_name, u.first_name || ' ' || u.last_name_paternal, u.email) as title,
        u.email as subtitle,
        '/admin/users/' || u.user_id as url,
        u.avatar_url as avatar
    FROM account_users u
    WHERE u.first_name ILIKE '%' || search_term || '%'
       OR u.last_name_paternal ILIKE '%' || search_term || '%'
       OR u.display_name ILIKE '%' || search_term || '%'
       OR u.email ILIKE '%' || search_term || '%'
    LIMIT 5)

    UNION ALL

    -- 4. Teams
    (SELECT 
        tm.team_id as id,
        'team'::text as type,
        tm.name as title,
        'Equipo' as subtitle,
        '/admin/teams/' || tm.team_id || '/dashboard' as url,
        NULL::text as avatar
    FROM teams tm
    WHERE tm.name ILIKE '%' || search_term || '%'
    LIMIT 5);
END;
$$;
