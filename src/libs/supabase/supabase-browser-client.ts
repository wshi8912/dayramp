import { createBrowserClient } from '@supabase/ssr';
import { getEnvVar } from '@/utils/get-env-var';
import { Database } from '@/types/supabase/database.types';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}