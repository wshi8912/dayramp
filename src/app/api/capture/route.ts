import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { toFile } from 'openai/uploads';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { userDayUtcRange, toUTC } from '@/libs/tz';

export const runtime = 'nodejs';

type SchemaTask = {
  title: string;
  note?: string;
  time: {
    type: 'range' | 'deadline' | 'none';
    startLocal?: string;
    endLocal?: string;
    dueLocal?: string;
  };
  estimateMin?: number;
  priority?: 'low' | 'mid' | 'high';
  confidence?: number;
};

type Schema = {
  date: string; // YYYY-MM-DD in user's TZ
  timezone: string; // IANA TZ
  tasks: SchemaTask[];
  language: 'ja' | 'en';
};

async function getUserTimezone(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'UTC';
  const { data } = await supabase.from('users').select('timezone').single();
  return data?.timezone || 'UTC';
}

async function transcribeWithOpenAI(file: File, language?: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // Whisper model for STT
  const transcription = await client.audio.transcriptions.create({
    file: await toFile(file, file.name || 'audio.webm'),
    model: 'whisper-1',
    language: language && language !== 'auto' ? language : undefined,
    // response_format defaults to json with text field on Node SDK
  } as any);
  // SDK typing varies; normalize to string
  const text = (transcription as any).text ?? String(transcription);
  return text;
}

async function extractSchemaWithLLM(text: string, tz: string, dateOverride?: string): Promise<Schema> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const nowUTC = new Date().toISOString();
  const { dayKey } = userDayUtcRange(nowUTC, tz);
  const date = dateOverride || dayKey;

  const system = `You convert task descriptions into a strict JSON schema for scheduling. Output ONLY compact JSON (no markdown). Schema:\n{\n  "date": "YYYY-MM-DD",\n  "timezone": "IANA TZ",\n  "tasks": [\n    {\n      "title": "text",\n      "note": "optional",\n      "time": {\n        "type": "range|deadline|none",\n        "startLocal": "YYYY-MM-DDTHH:mm",\n        "endLocal": "YYYY-MM-DDTHH:mm",\n        "dueLocal": "YYYY-MM-DDTHH:mm"\n      },\n      "estimateMin": 25,\n      "priority": "low|mid|high",\n      "confidence": 0.0-1.0\n    }\n  ],\n  "language": "ja|en"\n}\nRules:\n- Use timezone=${tz} and date=${date}.\n- Resolve natural phrases: morning=09:00, noon=12:00, evening=17:00, night=20:00.\n- If ambiguous, set time.type="none" and reduce confidence.\n- Keep strings concise; avoid extra commentary.`;

  const user = `timezone: ${tz}\ndate: ${date}\ntext:\n${text}`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  } as any);

  const content = resp.choices?.[0]?.message?.content ?? '{}';
  const json = JSON.parse(content) as Schema;
  // Ensure tz/date present
  json.timezone = tz;
  json.date = date;
  return json;
}

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
    const schema = await extractSchemaWithLLM(text, userTZ, dateOverride);
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

      // Create entry for traceability
      const entryInsert = {
        user_id: userId,
        source: hadAudio ? 'voice' : 'text',
        transcript: text,
        audio_url: null as string | null,
        lang: (language && language !== 'auto' ? language : (schema.language as any)) || null,
      };

      const { data: entry, error: entryError } = await supabase
        .from('entries')
        .insert(entryInsert)
        .select()
        .single();

      if (entryError) {
        console.error('CaptureAPI: Failed to insert entry', {
          message: entryError.message,
          details: (entryError as any).details,
          hint: (entryError as any).hint,
          code: (entryError as any).code,
        });
        return NextResponse.json({
          error: `Entry insert failed: ${entryError.message}`,
          details: (entryError as any).details || null,
          code: (entryError as any).code || null,
        }, { status: 500 });
      }
      console.log('CaptureAPI: Created entry %s', entry.id);

      const toInsert = (schema.tasks || []).map((t) => {
        // Convert local strings to UTC ISO based on tz
        const startAt = t.time?.type === 'range' && t.time.startLocal ? toUTC(t.time.startLocal, userTZ) : null;
        const endAt = t.time?.type === 'range' && t.time.endLocal ? toUTC(t.time.endLocal, userTZ) : null;
        const dueAt = t.time?.type === 'deadline' && t.time.dueLocal ? toUTC(t.time.dueLocal, userTZ) : null;
        return {
          user_id: userId,
          entry_id: entry.id,
          title: t.title,
          note: t.note ?? null,
          start_at: startAt,
          end_at: endAt,
          due_at: dueAt,
          estimate_min: t.estimateMin ?? null,
          priority: t.priority ?? null,
          status: 'todo',
          source: hadAudio ? 'voice' : 'manual',
          confidence: t.confidence ?? null,
        };
      });

      const createdIds: string[] = [];
      for (const row of toInsert) {
        const { data: created, error: taskError } = await supabase
          .from('tasks')
          .insert(row)
          .select()
          .single();

        if (taskError) {
          console.error('CaptureAPI: Task insert failed', {
            title: row.title,
            message: taskError.message,
            details: (taskError as any).details,
            hint: (taskError as any).hint,
            code: (taskError as any).code,
          });
          continue;
        }

        if (created?.id) createdIds.push(created.id);
      }
      console.log('CaptureAPI: Saved %d/%d tasks', createdIds.length, toInsert.length);

      return NextResponse.json({
        transcript: text,
        result: schema,
        saved: { entryId: entry.id, taskIds: createdIds, count: createdIds.length },
      });
    }

    return NextResponse.json({ transcript: text, result: schema, saved: null });
  } catch (err: any) {
    console.error('Capture API error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
