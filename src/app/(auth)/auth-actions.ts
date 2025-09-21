'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

export async function signInWithOAuth(provider: 'github' | 'google'): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return redirect(data.url);
}

export async function signUpWithPassword(email: string, password: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getURL('/auth/callback?type=signup'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return { 
      data: { 
        user: data.user, 
        session: null,
        requiresEmailConfirmation: true 
      }, 
      error: null 
    };
  }

  return { data: data, error: null };
}

export async function signInWithPassword(email: string, password: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: data, error: null };
}

export async function resetPassword(email: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getURL('/reset-password'),
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: data, error: null };
}

export async function updatePassword(newPassword: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: data, error: null };
}

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: 'global' });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: 'global' });

  if (error) {
    console.error(error);
  }

  redirect('/login');
}