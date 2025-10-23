import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { transcribeWithOpenAI } from './stt';
import { extractSchemaWithLLM } from './llm';
import { getUserTimezone } from './user';
import type { Schema } from './types';
import { saveEntryAndTasks } from './persist';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('CaptureAPI: OPENAI_API_KEY is not set');
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set on the server' }, { status: 500 });
    }
    const contentType = request.headers.get('content-type') || '';
    let text: string | undefined;
    let language: string | undefined;
    let tz: string | undefined;
    let dateOverride: string | undefined;
    let saveFlag: boolean | undefined;
    let hadAudio = false;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      text = body?.text;
      language = body?.language;
      tz = body?.timezone;
      dateOverride = body?.date;
      saveFlag = Boolean(body?.save);
    } else {
      const form = await request.formData();
      const file = form.get('file');
      language = String(form.get('language') || 'auto');
      tz = String(form.get('timezone') || '');
      dateOverride = String(form.get('date') || '') || undefined;
      saveFlag = String(form.get('save') || '') === 'true';

      if (file && file instanceof File) {
        hadAudio = true;
        console.log(
          'CaptureAPI: Received audio file (type=%s, size=%d bytes). Sending to STT (language=%s).',
          (file as any).type,
          (file as any).size,
          language
        );
        text = await transcribeWithOpenAI(file, language);
        console.log('CaptureAPI: STT done. Audio not persisted to storage (processed in-memory only).');
      } else {
        text = String(form.get('text') || '');
      }
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    const userTZ = tz || (await getUserTimezone());
    console.log('CaptureAPI: Using timezone=%s', userTZ);
    const schema: Schema = await extractSchemaWithLLM(text, userTZ, dateOverride);
    console.log('CaptureAPI: LLM extracted %d task(s)', schema?.tasks?.length || 0);

    // Optionally persist as tasks (and an entry) when save=true
    if (saveFlag) {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('CaptureAPI: No authenticated user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const userId = user.id;
      console.log('CaptureAPI: Authenticated user=%s', userId);
      const saved = await saveEntryAndTasks(supabase, userId, schema, text, hadAudio, language, userTZ);
      console.log('CaptureAPI: Saved %d task(s)', saved.count);
      return NextResponse.json({ transcript: text, result: schema, saved });
    }

    return NextResponse.json({ transcript: text, result: schema, saved: null });
  } catch (err: any) {
    console.error('Capture API error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
