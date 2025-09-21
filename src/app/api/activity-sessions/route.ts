import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ sessions: [] });
    }

    // Fetch recent sessions for the authenticated user
    const { data: sessionsData, error: fetchError } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50); // Limit for better performance and statistics

    if (fetchError) {
      console.error('Error fetching timer sessions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', sessions: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      sessions: sessionsData || [],
      success: true 
    });
    
  } catch (error) {
    console.error('API error in activity-sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', sessions: [] },
      { status: 500 }
    );
  }
}