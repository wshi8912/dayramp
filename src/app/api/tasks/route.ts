import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// GET /api/tasks?from=ISO&to=ISO
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to ISO params' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Select tasks that fall in range by start_at or due_at.
  // Also include fully-untimed tasks created in the range for MVP discoverability.
  const or = [
    `and(start_at.gte.${from},start_at.lt.${to})`,
    `and(due_at.gte.${from},due_at.lt.${to})`,
    `and(start_at.is.null,due_at.is.null,end_at.is.null,created_at.gte.${from},created_at.lt.${to})`,
  ].join(',');

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .or(or)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    title,
    note,
    startAt,
    endAt,
    dueAt,
    estimateMin,
    priority,
    status = 'todo',
    source = 'manual',
    confidence,
    entryId,
  } = body || {};

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const insert = {
    user_id: user.id,
    title,
    note: note ?? null,
    start_at: startAt ?? null,
    end_at: endAt ?? null,
    due_at: dueAt ?? null,
    estimate_min: estimateMin ?? null,
    priority: priority ?? null,
    status,
    source,
    confidence: confidence ?? null,
    entry_id: entryId ?? null,
  } as const;

  const { data, error } = await supabase.from('tasks').insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

