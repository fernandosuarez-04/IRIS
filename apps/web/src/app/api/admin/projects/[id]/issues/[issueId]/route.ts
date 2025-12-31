
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET - Get single issue details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string }> }
) {
  try {
    const { id: projectId, issueId } = await params;

    if (!projectId || !issueId) {
      return NextResponse.json({ error: 'Project ID and Issue ID are required' }, { status: 400 });
    }

    // Fetch the issue with all relations - using simpler syntax
    const { data: issue, error: issueError } = await supabaseAdmin
      .from('task_issues')
      .select(`
        *,
        status:task_statuses(status_id, name, color, status_type),
        priority:task_priorities(priority_id, name, level, color)
      `)
      .eq('issue_id', issueId)
      .eq('project_id', projectId)
      .single();

    if (issueError || !issue) {
      console.error('Error fetching issue:', issueError);
      return NextResponse.json({ error: 'Issue not found', details: issueError?.message }, { status: 404 });
    }

    // Fetch related data separately to avoid FK issues
    let assignee = null;
    let creator = null;
    let team = null;
    let project = null;

    if (issue.assignee_id) {
      const { data } = await supabaseAdmin
        .from('account_users')
        .select('user_id, display_name, first_name, last_name_paternal, avatar_url, email')
        .eq('user_id', issue.assignee_id)
        .single();
      assignee = data;
    }

    if (issue.creator_id) {
      const { data } = await supabaseAdmin
        .from('account_users')
        .select('user_id, display_name, first_name, avatar_url')
        .eq('user_id', issue.creator_id)
        .single();
      creator = data;
    }

    if (issue.team_id) {
      const { data } = await supabaseAdmin
        .from('teams')
        .select('team_id, name, slug')
        .eq('team_id', issue.team_id)
        .single();
      team = data;
    }

    if (issue.project_id) {
      const { data } = await supabaseAdmin
        .from('pm_projects')
        .select('project_id, project_name, project_key')
        .eq('project_id', issue.project_id)
        .single();
      project = data;
    }

    // Get labels for this issue
    const { data: labelData } = await supabaseAdmin
      .from('task_issue_labels')
      .select('label:task_labels(label_id, name, color)')
      .eq('issue_id', issueId);

    const labels = labelData?.map((l: any) => l.label).filter(Boolean) || [];

    // Get activity/history for this issue - simplified query
    const { data: history } = await supabaseAdmin
      .from('task_issue_history')
      .select('history_id, field_name, old_value, new_value, created_at, actor_id')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get comments for this issue - simplified query
    const { data: comments } = await supabaseAdmin
      .from('task_issue_comments')
      .select('comment_id, body, created_at, author_id')
      .eq('issue_id', issueId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    // Combine and sort activity
    const activity = [
      // Created event
      {
        id: `created-${issue.issue_id}`,
        type: 'created',
        actor: creator,
        created_at: issue.created_at
      },
      // History items
      ...(history || []).map((h: any) => ({
        id: h.history_id,
        type: 'history',
        field_name: h.field_name,
        old_value: h.old_value,
        new_value: h.new_value,
        actor: h.actor,
        created_at: h.created_at
      })),
      // Comments
      ...(comments || []).map((c: any) => ({
        id: c.comment_id,
        type: 'comment',
        body: c.body,
        actor: c.author,
        created_at: c.created_at
      }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Get statuses, priorities, and team members for editing
    const teamId = issue.team_id;

    const [statusRes, priorityRes, memberRes, labelOptionsRes] = await Promise.all([
      supabaseAdmin.from('task_statuses').select('*').eq('team_id', teamId).order('position'),
      supabaseAdmin.from('task_priorities').select('*').order('level'),
      supabaseAdmin.from('team_members').select('user:account_users(user_id, display_name, first_name, avatar_url)').eq('team_id', teamId),
      supabaseAdmin.from('task_labels').select('*').eq('team_id', teamId)
    ]);

    const teamPrefix = team?.slug?.toUpperCase() || 'TASK';

    return NextResponse.json({
      issue: {
        ...issue,
        assignee,
        creator,
        identifier: `${teamPrefix}-${issue.issue_number}`,
        labels
      },
      activity,
      project,
      team,
      statuses: statusRes.data || [],
      priorities: priorityRes.data || [],
      members: memberRes.data?.map((m: any) => m.user).filter(Boolean) || [],
      labelOptions: labelOptionsRes.data || []
    });

  } catch (err) {
    console.error('Error in GET issue:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH - Update issue
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string }> }
) {
  try {
    const { id: projectId, issueId } = await params;
    const body = await request.json();

    if (!projectId || !issueId) {
      return NextResponse.json({ error: 'Project ID and Issue ID are required' }, { status: 400 });
    }

    // Get current issue for history
    const { data: currentIssue } = await supabaseAdmin
      .from('task_issues')
      .select('*, status:task_statuses(name), priority:task_priorities(name), assignee:account_users!task_issues_assignee_id_fkey(display_name)')
      .eq('issue_id', issueId)
      .single();

    if (!currentIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Allowed fields to update
    const allowedFields = [
      'title', 'description', 'status_id', 'priority_id', 
      'assignee_id', 'due_date', 'estimate_points'
    ];

    const updateData: any = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle completed_at for done status
    if (body.status_id) {
      const { data: newStatus } = await supabaseAdmin
        .from('task_statuses')
        .select('status_type, name')
        .eq('status_id', body.status_id)
        .single();

      if (newStatus?.status_type === 'done' && !currentIssue.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus?.status_type !== 'done' && currentIssue.completed_at) {
        updateData.completed_at = null;
      }
    }

    // Update the issue
    const { data: updatedIssue, error } = await supabaseAdmin
      .from('task_issues')
      .update(updateData)
      .eq('issue_id', issueId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating issue:', error);
      return NextResponse.json({ error: 'Error updating issue' }, { status: 500 });
    }

    // Record history for changes (simplified - would need actor_id from auth)
    // For now, skip history recording to avoid auth complexity

    return NextResponse.json({ issue: updatedIssue });

  } catch (err) {
    console.error('Error in PATCH issue:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
