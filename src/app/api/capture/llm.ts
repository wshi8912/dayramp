import { OpenAI } from 'openai';
import { userDayUtcRange } from '@/libs/tz';
import type { Schema, SchemaTask } from './types';

export async function extractSchemaWithLLM(text: string, tz: string, dateOverride?: string): Promise<Schema> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const nowUTC = new Date().toISOString();
  const { dayKey } = userDayUtcRange(nowUTC, tz);
  const date = dateOverride || dayKey;

  const system = `You convert task descriptions into a strict JSON schema for scheduling. Output ONLY compact JSON (no markdown). Schema:\n{\n  "date": "YYYY-MM-DD",\n  "timezone": "IANA TZ",\n  "tasks": [\n    {\n      "kind": "task|event",\n      "title": "text",\n      "note": "optional",\n      "time": {\n        "type": "range|deadline|none",\n        "startLocal": "YYYY-MM-DDTHH:mm",\n        "endLocal": "YYYY-MM-DDTHH:mm",\n        "dueLocal": "YYYY-MM-DDTHH:mm"\n      },\n      "estimateMin": 25,\n      "priority": "low|mid|high",\n      "confidence": 0.0-1.0\n    }\n  ],\n  "language": "ja|en"\n}\nTime Rules (IMPORTANT):\n1. Scheduled activity (e.g., "14:00-15:00 meeting"): type="range", set BOTH startLocal and endLocal; set kind="event"\n2. Start-only task (e.g., "start at 14:00", no end): type="range", set ONLY startLocal; kind="event" if it is an event/meeting, otherwise kind="task"\n3. Deadline/due task (e.g., "submit by 18:00"): type="deadline", set ONLY dueLocal; kind="task"\n4. No specific time: type="deadline" with dueLocal="${date}T23:59:00" (end of the day in timezone ${tz}); kind="task"\n5. Time mentioned without calendar date: assume the date is ${date} and set startLocal/endLocal/dueLocal accordingly.\nNEVER set endLocal without startLocal.\n6. For kind="task", avoid type="none"; when no time info exists, use type="deadline" with dueLocal="${date}T23:59:00".\nEstimate Rules:\n- Provide estimateMin (minutes) for kind="task" items when you can infer effort; use reasonable values (multiples of 5, minimum 5).\n- Omit estimateMin if there is no clear basis.\n- Never set estimateMin for kind="event" items.\n- Always interpret dates and times in timezone=${tz} with base date=${date}.\n- Unless the user text explicitly references another day (e.g., tomorrow, next Tuesday, 2024-05-10), treat the request as happening on ${date}.\n- Explicit dates or relative phrases override the default day.\n- Resolve natural phrases: morning=09:00, noon=12:00, evening=17:00, night=20:00.\n- If unsure whether something is an event, default kind="task".\n- Keep strings concise; avoid extra commentary.`;

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
  const defaultDueLocal = `${date}T23:59:00`;
  json.tasks = (json.tasks || []).map((task) => {
    const kind = task.kind === 'event' ? 'event' : 'task';
    let estimateMin: number | undefined;
    if (kind === 'task') {
      const raw = (task as any).estimateMin;
      const numeric =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string'
          ? Number.parseFloat(raw)
          : undefined;
      if (Number.isFinite(numeric) && numeric && numeric > 0) {
        const rounded = Math.max(5, Math.round((numeric as number) / 5) * 5);
        estimateMin = rounded;
      }
    }
    const rawTime = (task.time ?? { type: 'none' }) as SchemaTask['time'];
    let time: SchemaTask['time'] = { ...rawTime };
    if (kind === 'task') {
      if (time.type === 'none') {
        time = { type: 'deadline', dueLocal: defaultDueLocal };
      } else if (time.type === 'deadline') {
        const due = time.dueLocal && time.dueLocal.trim().length > 0 ? time.dueLocal : defaultDueLocal;
        time = { ...time, dueLocal: due };
      }
    } else if (kind === 'event' && time.type === 'deadline' && !time.startLocal && !time.endLocal) {
      // Events without explicit range should remain unscheduled without a due time
      time = { type: 'none' };
    }
    return {
      ...task,
      kind,
      time,
      estimateMin,
    };
  });
  json.timezone = tz;
  json.date = date;
  return json;
}
