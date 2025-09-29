import { OpenAI } from 'openai';
import { userDayUtcRange } from '@/libs/tz';
import type { Schema } from './types';

export async function extractSchemaWithLLM(text: string, tz: string, dateOverride?: string): Promise<Schema> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const nowUTC = new Date().toISOString();
  const { dayKey } = userDayUtcRange(nowUTC, tz);
  const date = dateOverride || dayKey;

  const system = `You convert task descriptions into a strict JSON schema for scheduling. Output ONLY compact JSON (no markdown). Schema:\n{\n  "date": "YYYY-MM-DD",\n  "timezone": "IANA TZ",\n  "tasks": [\n    {\n      "kind": "task|event",\n      "title": "text",\n      "note": "optional",\n      "time": {\n        "type": "range|deadline|none",\n        "startLocal": "YYYY-MM-DDTHH:mm",\n        "endLocal": "YYYY-MM-DDTHH:mm",\n        "dueLocal": "YYYY-MM-DDTHH:mm"\n      },\n      "estimateMin": 25,\n      "priority": "low|mid|high",\n      "confidence": 0.0-1.0\n    }\n  ],\n  "language": "ja|en"\n}\nTime Rules (IMPORTANT):\n1. Scheduled activity (e.g., "14:00-15:00 meeting"): type="range", set BOTH startLocal and endLocal; set kind="event"\n2. Start-only task (e.g., "start at 14:00", no end): type="range", set ONLY startLocal; kind="event" if it is an event/meeting, otherwise kind="task"\n3. Deadline/due task (e.g., "submit by 18:00"): type="deadline", set ONLY dueLocal; kind="task"\n4. No specific time: type="deadline" with dueLocal="${date}T23:59:00" (end of the day in timezone ${tz}); kind="task"\n5. Time mentioned without calendar date: assume the date is ${date} and set startLocal/endLocal/dueLocal accordingly.\nNEVER set endLocal without startLocal.\n- Always interpret dates and times in timezone=${tz} with base date=${date}.\n- Unless the user text explicitly references another day (e.g., tomorrow, next Tuesday, 2024-05-10), treat the request as happening on ${date}.\n- Explicit dates or relative phrases override the default day.\n- Resolve natural phrases: morning=09:00, noon=12:00, evening=17:00, night=20:00.\n- If unsure whether something is an event, default kind="task".\n- Keep strings concise; avoid extra commentary.`;

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
  json.tasks = (json.tasks || []).map((task) => ({
    ...task,
    kind: task.kind === 'event' ? 'event' : 'task',
  }));
  json.timezone = tz;
  json.date = date;
  return json;
}
