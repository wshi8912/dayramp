import { OpenAI } from 'openai';
import { toFile } from 'openai/uploads';

export async function transcribeWithOpenAI(file: File, language?: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await client.audio.transcriptions.create({
    file: await toFile(file, file.name || 'audio.webm'),
    model: 'whisper-1',
    language: language && language !== 'auto' ? language : undefined,
  } as any);
  const text = (transcription as any).text ?? String(transcription);
  return text;
}

