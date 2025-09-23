import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/(auth)/auth-actions';
import { CoreView } from './CoreView';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { toUTC, userDayUtcRange } from '@/libs/tz';

export default async function CorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fallback to UTC if not found
  const { data: userRow } = await supabase.from('users').select('timezone').single();
  const tz = userRow?.timezone || 'UTC';

  const nowUTC = new Date().toISOString();
  const { dayKey: todayKey } = userDayUtcRange(nowUTC, tz);

  // Allow date override via ?date=YYYY-MM-DD (user TZ)
  const sp = (await searchParams) ?? {};
  const rawDate = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const isValidDate = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
  const dayKey = isValidDate ? (rawDate as string) : todayKey;

  const startUtc = toUTC(`${dayKey}T00:00:00`, tz);
  const endUtc = toUTC(`${dayKey}T23:59:59`, tz);

  // Fetch tasks in range (start_at/due_at in range OR untimed created in range)
  const or = [
    // Tasks starting today in user's TZ
    `and(start_at.gte."${startUtc}",start_at.lt."${endUtc}")`,
    // Tasks ending today in user's TZ (covers ranges that end today)
    `and(end_at.gte."${startUtc}",end_at.lt."${endUtc}")`,
    // Tasks overlapping today (start before endUtc AND end after startUtc)
    `and(start_at.lt."${endUtc}",end_at.gte."${startUtc}")`,
    // Tasks due today
    `and(due_at.gte."${startUtc}",due_at.lt."${endUtc}")`,
    // Untimed tasks created today (no start/end/due)
    `and(start_at.is.null,due_at.is.null,end_at.is.null,created_at.gte."${startUtc}",created_at.lt."${endUtc}")`,
  ].join(',');

  const { data: tasks = [] } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user?.id || '')
    .or(or)
    .order('created_at', { ascending: false });

  // Pinned tasks at top: unscheduled (no start/end/due), not completed
  const { data: untimedAll = [] } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user?.id || '')
    .is('start_at', null)
    .is('end_at', null)
    .is('due_at', null)
    .order('created_at', { ascending: false });

  // Map DB -> UI props
  const timed = (tasks || [])
    .filter((t: any) => t.start_at || t.end_at || t.due_at)
    .map((t: any) => ({ id: t.id, title: t.title, note: t.note ?? undefined, startAt: t.start_at ?? undefined, endAt: t.end_at ?? undefined, dueAt: t.due_at ?? undefined, status: t.status }));
  // Map separate pinned untimed list (regardless of created date)
  const untimed = (untimedAll || [])
    .map((t: any) => ({ id: t.id, title: t.title, note: t.note ?? undefined, status: t.status }));

  return (
    <div className='container mx-auto max-w-5xl px-4 py-8'>
      <CoreView tz={tz} dayKey={dayKey} timed={timed} untimed={untimed} />
    </div>
  );
}
