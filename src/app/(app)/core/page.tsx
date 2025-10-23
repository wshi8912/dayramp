import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { toUTC, userDayUtcRange } from '@/libs/tz';

import { CoreView } from './CoreView';

export default async function CorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fallback to UTC if not found
  const { data: userRow } = await supabase.from('users').select('timezone').single();
  const tz = (userRow?.timezone as string) || 'UTC';

  const nowUTC = new Date().toISOString();
  const { dayKey: todayKey } = userDayUtcRange(nowUTC, tz);

  // Allow date override via ?date=YYYY-MM-DD (user TZ)
  const sp = (await searchParams) ?? {};
  const rawDate = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const isValidDate = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
  const dayKey = isValidDate ? (rawDate as string) : todayKey;

  const startUtc = toUTC(`${dayKey}T00:00:00`, tz);
  const endUtc = toUTC(`${dayKey}T23:59:59`, tz);
  // Compute tomorrow's range (in user's TZ) to support "due by tomorrow" tab in UntimedPane
  const nextDayDate = new Date(`${dayKey}T00:00:00Z`);
  nextDayDate.setUTCDate(nextDayDate.getUTCDate() + 1);
  const tomorrowKey = nextDayDate.toISOString().slice(0, 10);
  const startUtcTomorrow = toUTC(`${tomorrowKey}T00:00:00`, tz);
  const endUtcTomorrow = toUTC(`${tomorrowKey}T23:59:59`, tz);

  // Fetch tasks for calendar display (scheduled tasks + deadline tasks for today)
  const calendarOr = [
    // Events overlapping the window
    `and(kind.eq.event,start_at.lt."${endUtc}",end_at.gte."${startUtc}")`,
    // Task timeboxes overlapping the window
    `and(kind.eq.task,start_at.not.is.null,end_at.not.is.null,start_at.lt."${endUtc}",end_at.gte."${startUtc}")`,
    // Task deadlines landing today (no schedule)
    `and(kind.eq.task,start_at.is.null,end_at.is.null,due_at.not.is.null,due_at.gte."${startUtc}",due_at.lt."${endUtc}")`
  ].join(',');

  const { data: tasks = [] } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user?.id || '')
    .or(calendarOr)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Fetch tasks for upper pane: no time + start only + today's deadlines + tomorrow's deadlines
  const untimedOr = [
    // Completely unscheduled tasks
    `and(start_at.is.null,end_at.is.null,due_at.is.null)`,
    // Start-only tasks (no end time, no deadline)
    `and(start_at.not.is.null,end_at.is.null,due_at.is.null)`,
    // Today's deadline tasks (also shown in upper pane)
    `and(start_at.is.null,due_at.gte."${startUtc}",due_at.lt."${endUtc}")`,
    // Tomorrow's deadline tasks (for tab switching)
    `and(start_at.is.null,due_at.gte."${startUtcTomorrow}",due_at.lt."${endUtcTomorrow}")`,
  ].join(',');

  const { data: untimedAll = [] } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user?.id || '')
    .eq('kind', 'task')
    .or(untimedOr)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Map DB -> UI props for calendar (scheduled + deadlines)
  const timed = (tasks || [])
    .filter((t: any) =>
      (t.kind === 'event' && t.start_at && t.end_at) ||
      (t.kind === 'task' && t.start_at && t.end_at) ||
      (t.kind === 'task' && !t.start_at && !t.end_at && t.due_at)
    )
    .map((t: any) => ({
      id: t.id,
      title: t.title,
      note: t.note ?? undefined,
      startAt: t.start_at ?? undefined,
      endAt: t.end_at ?? undefined,
      dueAt: t.due_at ?? undefined,
      status: t.status,
      kind: t.kind === 'event' ? 'event' : 'task'
    }));

  // Map upper pane tasks
  const untimed = (untimedAll || [])
    .map((t: any) => ({
      id: t.id,
      title: t.title,
      note: t.note ?? undefined,
      startAt: t.start_at ?? undefined,  // Include for display
      dueAt: t.due_at ?? undefined,      // Include for display
      status: t.status,
      kind: 'task'
    }));

  return (
    <div className='container mx-auto max-w-5xl px-0 sm:px-4 py-4 sm:py-8'>
      <CoreView tz={tz} dayKey={dayKey} timed={timed} untimed={untimed} />
    </div>
  );
}
