import { OpenAI } from 'openai';
import { userDayUtcRange } from '@/libs/tz';
import type { Schema } from './types';

export async function extractSchemaWithLLM(text: string, tz: string, dateOverride?: string): Promise<Schema> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const nowUTC = new Date().toISOString();
  const { dayKey } = userDayUtcRange(nowUTC, tz);
  const date = dateOverride || dayKey;

  const system = `You convert task descriptions into a strict JSON schema for scheduling. Output ONLY compact JSON (no markdown). Schema:\n{\n  "date": "YYYY-MM-DD",\n  "timezone": "IANA TZ",\n  "tasks": [\n    {\n      "title": "text",\n      "note": "optional",\n      "time": {\n        "type": "range|deadline|none",\n        "startLocal": "YYYY-MM-DDTHH:mm",\n        "endLocal": "YYYY-MM-DDTHH:mm",\n        "dueLocal": "YYYY-MM-DDTHH:mm"\n      },\n      "estimateMin": 25,\n      "priority": "low|mid|high",\n      "confidence": 0.0-1.0\n    }\n  ],\n  "language": "ja|en"\n}\nRules:\n- Use timezone=${tz} and date=${date}.\n- Resolve natural phrases: morning=09:00, noon=12:00, evening=17:00, night=20:00.\n- If ambiguous, set time.type=\"none\" and reduce confidence.\n- Keep strings concise; avoid extra commentary.`;

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
  json.timezone = tz;
  json.date = date;
  return json;
}

