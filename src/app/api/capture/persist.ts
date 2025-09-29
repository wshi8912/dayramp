import { toUTC } from '@/libs/tz';

import type { Schema } from './types';

export async function saveEntryAndTasks(
  supabase: any,
  userId: string,
  schema: Schema,
  text: string,
  hadAudio: boolean,
  language?: string,
  userTZ?: string
): Promise<{ entryId: string; taskIds: string[]; count: number }> {
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
  if (entryError) throw new Error(`Entry insert failed: ${entryError.message}`);

  const tz = userTZ || schema.timezone;
  const toInsert = (schema.tasks || []).map((t) => {
    let startAt = null;
    let endAt = null;
    let dueAt = null;
    const kind = t.kind === 'event' ? 'event' : 'task';

    if (t.time?.type === 'range') {
      if (t.time.startLocal) {
        startAt = toUTC(t.time.startLocal, tz);
        // end_at is only set when start_at exists
        if (t.time.endLocal) {
          endAt = toUTC(t.time.endLocal, tz);
        }
      }
      // If no startLocal, ignore endLocal (validation: end_at cannot exist without start_at)
    } else if (t.time?.type === 'deadline' && t.time.dueLocal && kind !== 'event') {
      dueAt = toUTC(t.time.dueLocal, tz);
    }

    return {
      user_id: userId,
      entry_id: entry.id,
      title: t.title,
      note: t.note ?? null,
      start_at: startAt,
      end_at: endAt,
      due_at: dueAt,
      kind,
      estimate_min: t.estimateMin ?? null,
      priority: t.priority ?? null,
      status: kind === 'event' ? 'pending' : 'todo',
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
    if (taskError) continue;
    if (created?.id) createdIds.push(created.id);
  }
  return { entryId: entry.id, taskIds: createdIds, count: createdIds.length };
}
