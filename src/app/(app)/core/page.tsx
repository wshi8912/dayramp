import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/(auth)/auth-actions';
import { CoreView } from './CoreView';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { userDayUtcRange } from '@/libs/tz';

export default async function CorePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fallback to UTC if not found
  const { data: userRow } = await supabase.from('users').select('timezone').single();
  const tz = userRow?.timezone || 'UTC';

  const nowUTC = new Date().toISOString();
  const { startUtc, endUtc } = userDayUtcRange(nowUTC, tz);

  // Fetch tasks in range (start_at/due_at in range OR untimed created in range)
  const or = [
    `and(start_at.gte.${startUtc},start_at.lt.${endUtc})`,
    `and(due_at.gte.${startUtc},due_at.lt.${endUtc})`,
    `and(start_at.is.null,due_at.is.null,end_at.is.null,created_at.gte.${startUtc},created_at.lt.${endUtc})`,
  ].join(',');

  const { data: tasks = [] } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user?.id || '')
    .or(or)
    .order('created_at', { ascending: false });

  // Map DB -> UI props
  const timed = (tasks || [])
    .filter((t: any) => t.start_at || t.end_at || t.due_at)
    .map((t: any) => ({ id: t.id, title: t.title, note: t.note ?? undefined, startAt: t.start_at ?? undefined, endAt: t.end_at ?? undefined, dueAt: t.due_at ?? undefined }));
  const untimed = (tasks || [])
    .filter((t: any) => !t.start_at && !t.end_at && !t.due_at)
    .map((t: any) => ({ id: t.id, title: t.title, note: t.note ?? undefined }));

  return (
    <div className='container mx-auto max-w-5xl px-4 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-3xl font-semibold text-foreground'>Today</h1>
        <form action={signOutAction}>
          <Button type='submit' variant='outline'>Log Out</Button>
        </form>
      </div>
      <CoreView tz={tz} timed={timed} untimed={untimed} />
    </div>
  );
}
