import { NextRequest, NextResponse } from 'next/server';

import { isTaskKind } from '@/features/tasks/task-kind';
import { isTaskStatusDb } from '@/features/tasks/task-status';
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

  // Select items relevant to the requested range following task/event semantics.
  const or = [
    // Events overlapping range
    `and(kind.eq.event,start_at.lt.${to},end_at.gte.${from})`,
    // Task timeboxes overlapping range
    `and(kind.eq.task,start_at.not.is.null,end_at.not.is.null,start_at.lt.${to},end_at.gte.${from})`,
    // Task deadlines landing inside range (no schedule)
    `and(kind.eq.task,start_at.is.null,end_at.is.null,due_at.gte.${from},due_at.lt.${to})`,
    // Start-only tasks kicking off inside range
    `and(kind.eq.task,start_at.not.is.null,end_at.is.null,start_at.gte.${from},start_at.lt.${to})`,
    // Fully-untimed tasks created within range (MVP discoverability)
    `and(kind.eq.task,start_at.is.null,end_at.is.null,due_at.is.null,created_at.gte.${from},created_at.lt.${to})`
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
    status,
    source = 'manual',
    confidence,
    entryId,
    kind: rawKind,
  } = body || {};

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const kind = isTaskKind(rawKind) ? rawKind : 'task';

  // Determine default status: events are pending by default, tasks are todo
  const resolvedStatus = status ?? (kind === 'event' ? 'pending' : 'todo');

  if (!isTaskStatusDb(resolvedStatus)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  if (kind === 'event') {
    if (!startAt || !endAt) {
      return NextResponse.json({ error: 'Events require both start and end times' }, { status: 400 });
    }
    if (dueAt) {
      return NextResponse.json({ error: 'Events cannot have due dates' }, { status: 400 });
    }
  }

  // Validation: task end_at cannot exist without start_at
  if (kind === 'task' && !startAt && endAt) {
    return NextResponse.json({ error: 'End time cannot be set without a start time' }, { status: 400 });
  }

  const insert = {
    user_id: user.id,
    title,
    note: note ?? null,
    start_at: startAt ?? null,
    end_at: startAt && endAt ? endAt : null, // Only set if start_at exists
    due_at: kind === 'event' ? null : (dueAt ?? null),
    kind,
    estimate_min: estimateMin ?? null,
    priority: priority ?? null,
    status: resolvedStatus,
    source,
    confidence: confidence ?? null,
    entry_id: entryId ?? null,
  } as const;

  const { data, error } = await supabase.from('tasks').insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
