import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase/database.types';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';

const siteUrl = getURL();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';

  let supabaseResponse = NextResponse.next({ request });

  if (token_hash && type) {
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

    // Exchange the token_hash for a session
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'invite' | 'email_change',
      token_hash,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let redirectTo = siteUrl;
      
      // Determine redirect based on type
      if (type === 'recovery') {
        // For password recovery, redirect to reset password page
        redirectTo = `${siteUrl}/reset-password`;
      } else if (type === 'signup' && user?.id) {
        // For signup confirmation, redirect to home with confirmed message
        redirectTo = `${siteUrl}/?confirmed=true`;
      } else if (type === 'invite' && user?.id) {
        // For invites, redirect to home with welcome message
        redirectTo = `${siteUrl}/?welcome=true`;
      } else if (type === 'email_change' && user?.id) {
        // For email change, redirect to home with email changed message
        redirectTo = `${siteUrl}/?email_changed=true`;
      } else if (user?.id) {
        // Default: redirect to home if user exists
        redirectTo = next.startsWith('/') ? `${siteUrl}${next}` : siteUrl;
      } else {
        // If no user, redirect to login
        redirectTo = `${siteUrl}/login`;
      }

      const finalResponse = NextResponse.redirect(redirectTo);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        finalResponse.cookies.set(cookie);
      });
      return finalResponse;
    } else {
      // If there's an error, redirect to login with error message
      console.error('Token verification error:', error);
      return NextResponse.redirect(`${siteUrl}/login?error=invalid_token`);
    }
  }

  // If no token_hash or type, redirect to home
  return NextResponse.redirect(siteUrl);
}