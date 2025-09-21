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
  // Accept camelCase; map to snake_case.
  const update: Record<string, any> = {};
  if ('title' in body) update.title = body.title ?? null;
  if ('note' in body) update.note = body.note ?? null;
  if ('startAt' in body) update.start_at = body.startAt ?? null;
  if ('endAt' in body) update.end_at = body.endAt ?? null;
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

