import { NextRequest, NextResponse } from 'next/server';
import { formatInTimeZone } from 'date-fns-tz';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { toUTC } from '@/libs/tz';

const DEV_ONLY = !process.env.VERCEL;
const TOKYO_TZ = 'Asia/Tokyo';
const DEV_NOTE_PREFIX = '[dev-seed]';
const DEV_USER_ID = '12345678-1234-1234-1234-123456789012';

const METHOD_NOT_ALLOWED = NextResponse.json({ error: 'Method not allowed' }, { status: 405 });

export async function POST(_request: NextRequest) {
  if (!DEV_ONLY) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.split('.').length !== 3) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid SUPABASE_SERVICE_ROLE_KEY. Copy the service_role key from supabase/.env or the Supabase dashboard into .env.local and restart the dev server.'
      },
      { status: 500 }
    );
  }

  const todayKey = formatInTimeZone(new Date(), TOKYO_TZ, 'yyyy-MM-dd');

  const seeds: Array<{
    title: string;
    note: string;
    kind: 'task' | 'event';
    status: 'todo' | 'pending' | 'done';
    priority: 'low' | 'mid' | 'high';
    estimate?: number;
    start?: string;
    end?: string;
    due?: string;
  }> = [
    {
      title: 'Focus work: architecture review',
      note: `${DEV_NOTE_PREFIX} timeboxed deep work block`,
      kind: 'task',
      status: 'todo',
      priority: 'high',
      estimate: 90,
      start: '09:00',
      end: '10:30'
    },
    {
      title: 'Morning sync follow-up',
      note: `${DEV_NOTE_PREFIX} completed timebox`,
      kind: 'task',
      status: 'done',
      priority: 'mid',
      estimate: 30,
      start: '08:00',
      end: '08:30'
    },
    {
      title: 'Review design doc with PM',
      note: `${DEV_NOTE_PREFIX} pending timebox`,
      kind: 'task',
      status: 'pending',
      priority: 'mid',
      estimate: 60,
      start: '14:30',
      end: '15:30'
    },
    {
      title: 'Start QA checklist',
      note: `${DEV_NOTE_PREFIX} start-only task anchor`,
      kind: 'task',
      status: 'todo',
      priority: 'mid',
      estimate: 45,
      start: '11:30'
    },
    {
      title: 'Send daily status report',
      note: `${DEV_NOTE_PREFIX} due-only task`,
      kind: 'task',
      status: 'todo',
      priority: 'mid',
      estimate: 20,
      due: '18:00'
    },
    {
      title: 'Escalate blocker summary',
      note: `${DEV_NOTE_PREFIX} overdue due-only task`,
      kind: 'task',
      status: 'todo',
      priority: 'high',
      estimate: 15,
      due: '07:30'
    },
    {
      title: 'Draft retro talking points',
      note: `${DEV_NOTE_PREFIX} untimed backlog item`,
      kind: 'task',
      status: 'todo',
      priority: 'low',
      estimate: 40
    },
    {
      title: 'Team standup',
      note: `${DEV_NOTE_PREFIX} daily event`,
      kind: 'event',
      status: 'pending',
      priority: 'mid',
      estimate: 15,
      start: '10:00',
      end: '10:15'
    },
    {
      title: 'Product demo with client',
      note: `${DEV_NOTE_PREFIX} key event`,
      kind: 'event',
      status: 'pending',
      priority: 'high',
      estimate: 60,
      start: '13:00',
      end: '14:00'
    },
    {
      title: 'Client onboarding recap',
      note: `${DEV_NOTE_PREFIX} completed event`,
      kind: 'event',
      status: 'done',
      priority: 'mid',
      estimate: 30,
      start: '07:30',
      end: '08:00'
    },
    {
      title: 'Evening yoga class',
      note: `${DEV_NOTE_PREFIX} personal wellness event`,
      kind: 'event',
      status: 'pending',
      priority: 'low',
      estimate: 60,
      start: '19:30',
      end: '20:30'
    }
  ];

  const toUtc = (time?: string | null) => (time ? toUTC(`${todayKey}T${time}`, TOKYO_TZ) : null);

  const payload = seeds.map((seed) => ({
    user_id: DEV_USER_ID,
    entry_id: null,
    title: seed.title,
    note: seed.note,
    start_at: toUtc(seed.start ?? null),
    end_at: toUtc(seed.end ?? null),
    due_at: toUtc(seed.due ?? null),
    estimate_min: seed.estimate ?? null,
    priority: seed.priority,
    status: seed.status,
    source: 'manual',
    confidence: null,
    kind: seed.kind
  }));

  const { error: deleteError } = await supabaseAdminClient
    .from('tasks')
    .delete()
    .eq('user_id', DEV_USER_ID)
    .like('note', `${DEV_NOTE_PREFIX}%`);

  if (deleteError) {
    if (deleteError.message?.includes('JWSError')) {
      return NextResponse.json(
        {
          error:
            'Supabase rejected the service role key (JWSError). Verify SUPABASE_SERVICE_ROLE_KEY in .env.local matches your local Supabase service_role key.'
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdminClient
    .from('tasks')
    .insert(payload)
    .select('id, title, kind, status');

  if (error) {
    if (error.message?.includes('JWSError')) {
      return NextResponse.json(
        {
          error:
            'Supabase rejected the service role key (JWSError). Verify SUPABASE_SERVICE_ROLE_KEY in .env.local matches your local Supabase service_role key.'
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    dayKey: todayKey,
    timezone: TOKYO_TZ,
    inserted: data?.length ?? 0,
    items: data ?? []
  });
}

export function GET() {
  return METHOD_NOT_ALLOWED;
}

export function PUT() {
  return METHOD_NOT_ALLOWED;
}

export function DELETE() {
  return METHOD_NOT_ALLOWED;
}
