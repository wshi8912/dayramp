import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { TimezoneForm } from '@/components/settings/TimezoneForm';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function getUserTimezone() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { timezone: 'UTC' };

  const { data } = await supabase.from('users').select('timezone').single();
  return { timezone: data?.timezone ?? 'UTC' };
}

// Minimal TZ list for MVP; can be replaced by @vvo/tzdb
const fallbackTimezones = [
  'UTC',
  'Asia/Tokyo',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
];

export default async function TimezonePage() {
  const { timezone } = await getUserTimezone();

  async function updateTimezoneAction(_prevState: any, formData: FormData) {
    'use server';
    const tz = String(formData.get('timezone') || 'UTC');
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Unauthorized' };
    await supabase.from('users').update({ timezone: tz }).eq('id', user.id);
    // Revalidate relevant pages
    revalidatePath('/core');
    revalidatePath('/settings/timezone');
    return { ok: true, timezone: tz };
  }

  return (
    <div className='container mx-auto max-w-2xl px-4 py-8'>
      <h1 className='mb-6 text-2xl font-semibold'>Timezone</h1>
      <TimezoneForm current={timezone} timezones={fallbackTimezones} action={updateTimezoneAction} />
    </div>
  );
}
