import { NextRequest, NextResponse } from 'next/server';
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

  // Validation: if updating times, ensure end_at cannot exist without start_at
  if ('endAt' in body && !('startAt' in body)) {
    // Need to check current start_at from database
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('start_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!currentTask?.start_at && body.endAt) {
      return NextResponse.json({ error: 'End time cannot be set without a start time' }, { status: 400 });
    }
  }

  if ('startAt' in body && 'endAt' in body && !body.startAt && body.endAt) {
    return NextResponse.json({ error: 'End time cannot be set without a start time' }, { status: 400 });
  }

  // Accept camelCase; map to snake_case.
  const update: Record<string, any> = {};
  if ('title' in body) update.title = body.title ?? null;
  if ('note' in body) update.note = body.note ?? null;
  if ('startAt' in body) update.start_at = body.startAt ?? null;
  if ('endAt' in body) {
    // Only set end_at if start_at exists or is being set
    const hasStart = body.startAt || (update.start_at === undefined && 'startAt' in body === false);
    update.end_at = hasStart ? (body.endAt ?? null) : null;
  }
  if ('dueAt' in body) update.due_at = body.dueAt ?? null;
  if ('estimateMin' in body) update.estimate_min = body.estimateMin ?? null;
  if ('priority' in body) update.priority = body.priority ?? null;
  if ('status' in body) update.status = body.status ?? null;
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

