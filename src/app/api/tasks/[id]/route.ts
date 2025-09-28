import { NextRequest, NextResponse } from 'next/server';

import { isTaskKind } from '@/features/tasks/task-kind';
import { isTaskStatusDb } from '@/features/tasks/task-status';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: currentTask, error: currentError } = await supabase
    .from('tasks')
    .select('start_at,end_at,due_at,kind,status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (currentError && currentError.code !== 'PGRST116') {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  if (!currentTask) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let nextKind = currentTask.kind as unknown;
  if ('kind' in body) {
    if (!isTaskKind(body.kind)) {
      return NextResponse.json({ error: 'Invalid kind value' }, { status: 400 });
    }
    nextKind = body.kind;
  }

  const resolvedKind = isTaskKind(nextKind) ? nextKind : 'task';

  const nextStartAt = 'startAt' in body ? body.startAt ?? null : currentTask.start_at;
  const nextEndAt = 'endAt' in body ? body.endAt ?? null : currentTask.end_at;
  const nextDueAt = 'dueAt' in body ? body.dueAt ?? null : currentTask.due_at;

  if (resolvedKind === 'event') {
    if (!nextStartAt || !nextEndAt) {
      return NextResponse.json({ error: 'Events require both start and end times' }, { status: 400 });
    }
    if (nextDueAt) {
      return NextResponse.json({ error: 'Events cannot have due dates' }, { status: 400 });
    }
  }

  if (resolvedKind === 'task' && !nextStartAt && nextEndAt) {
    return NextResponse.json({ error: 'End time cannot be set without a start time' }, { status: 400 });
  }

  // Accept camelCase; map to snake_case.
  const update: Record<string, any> = {};
  if ('title' in body) update.title = body.title ?? null;
  if ('note' in body) update.note = body.note ?? null;
  if ('startAt' in body) update.start_at = nextStartAt;
  if ('endAt' in body) update.end_at = nextEndAt;
  if ('dueAt' in body) update.due_at = resolvedKind === 'event' ? null : nextDueAt;
  if ('kind' in body) update.kind = resolvedKind;
  if (resolvedKind === 'event' && !('dueAt' in body)) {
    update.due_at = null;
  }
  if ('estimateMin' in body) update.estimate_min = body.estimateMin ?? null;
  if ('priority' in body) update.priority = body.priority ?? null;
  if ('status' in body) {
    if (body.status === null || body.status === undefined) {
      return NextResponse.json({ error: 'Status cannot be empty' }, { status: 400 });
    }
    if (!isTaskStatusDb(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    update.status = body.status;
  }
  if ('source' in body) update.source = body.source ?? null;
  if ('confidence' in body) update.confidence = body.confidence ?? null;
  if ('entryId' in body) update.entry_id = body.entryId ?? null;

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
