import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase/database.types';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';

const siteUrl = getURL();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  let supabaseResponse = NextResponse.next({ request });

  if (code) {
    const supabase = createServerClient<Database>(
      getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
      getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              supabaseResponse.cookies.set(name, value, options as CookieOptions);
            }
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let redirectTo = siteUrl;

    if (type === 'recovery') {
      redirectTo = `${siteUrl}/reset-password`;
    } else if (type === 'signup' && user?.id) {
      redirectTo = `${siteUrl}/core`;
    } else if (user?.id) {
      redirectTo = `${siteUrl}/core`;
    } else {
      redirectTo = `${siteUrl}/login`;
    }

    const finalResponse = NextResponse.redirect(redirectTo);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });
    return finalResponse;
  }

  return NextResponse.redirect(siteUrl);
}