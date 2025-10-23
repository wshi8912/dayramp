import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getUserTimezone(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'UTC';
  const { data } = await supabase.from('users').select('timezone').single();
  return data?.timezone || 'UTC';
}

