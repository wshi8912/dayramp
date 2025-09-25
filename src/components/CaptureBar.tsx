'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic, Send, X } from 'lucide-react';

type SchemaTask = {
  title: string;
  note?: string;
  time: { type: 'range' | 'deadline' | 'none'; startLocal?: string; endLocal?: string; dueLocal?: string };
  estimateMin?: number;
  priority?: 'low' | 'mid' | 'high';
  confidence?: number;
};

type Schema = {
  date: string;
  timezone: string;
  language: 'ja' | 'en';
  tasks: SchemaTask[];
};

export function CaptureBar({ tz, dayKey }: { tz: string; dayKey: string }) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Removed result info banner; preview list below is sufficient
  const [text, setText] = useState('');
  const [lastSchema, setLastSchema] = useState<Schema | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const sendingRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Digital clock (HH:mm:ss) in user's TZ — avoid SSR mismatch
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const nowStr = useMemo(() => {
    if (!now) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: tz,
      }).format(now);
    } catch {
      return now.toLocaleTimeString();
    }
  }, [now, tz]);

  // Date tabs (prev / today / next)
  const toKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const fromKey = (key: string) => new Date(`${key}T00:00:00`);
  const mmdd = (key: string) => `${key.slice(5, 7)}/${key.slice(8, 10)}`;
  const todayKey = useMemo(() => {
    const nowLocal = new Date();
    // Best-effort: derive today in tz by using Intl to get parts
    try {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(nowLocal);
      // en-CA gives YYYY-MM-DD
      return parts;
    } catch {
      return toKey(nowLocal);
    }
  }, [tz]);
  const todayDate = fromKey(todayKey);
  const prevKey = toKey(new Date(todayDate.getTime() - 24 * 60 * 60 * 1000));
  const nextKey = toKey(new Date(todayDate.getTime() + 24 * 60 * 60 * 1000));
  const activeKey = dayKey;

  const pushDate = (key: string) => {
    const params = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    params.set('date', key);
    router.push(`/core?${params.toString()}`);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      setSupported(false);
    }
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 200) as unknown as number;
    // Auto stop at 60s
    timeoutRef.current = window.setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
    }, 60000) as unknown as number;
  };

  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
    setElapsed(0);
  };

  const stopAll = () => {
    try {
      recorderRef.current?.stop();
    } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    clearTimer();
  };

  const onStart = async () => {
    setError(null);
    if (!navigator.mediaDevices) {
      setSupported(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        setRecording(false);
        clearTimer();
        // Auto-send when recording stops (unless user cancelled)
        if (!cancelledRef.current && !sendingRef.current) {
          // slight delay to ensure chunks are flushed
          setTimeout(() => {
            void onSend();
          }, 50);
        } else {
          cancelledRef.current = false;
        }
      };
      rec.start();
      setRecording(true);
      startTimer();
    } catch (e: any) {
      setError('Microphone permission denied or unavailable');
      setSupported(false);
    }
  };

  const onCancel = () => {
    // Discard recording and reset
    chunksRef.current = [];
    cancelledRef.current = true;
    stopAll();
  };

  const onSend = async () => {
    if (sendingRef.current) return;
    setSending(true);
    sendingRef.current = true;
    setError(null);

    // Ensure we have final chunks: if still recording, stop first and wait a tick
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
      // Wait a moment for onstop to flush data
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      if (!blob.size) {
        setError('No audio captured');
        setSending(false);
        return;
      }
      const form = new FormData();
      form.append('file', blob, 'capture.webm');
      form.append('language', 'auto');
      form.append('timezone', tz);
      form.append('save', 'true');
      form.append('date', dayKey);

      const res = await fetch('/api/capture', {
        method: 'POST',
        body: form,
        credentials: 'include',
        cache: 'no-store',
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // non-JSON
      }
      if (!res.ok) {
        const errMsg = json?.error || text || 'Request failed';
        throw new Error(errMsg);
      }
      // res.ok true and json parsed
      // Keep UI minimal after processing; rely on preview and refreshed list
      setLastSchema(json?.result ?? null);
      // Future: open ReviewModal and allow user to publish tasks
    } catch (e: any) {
      console.error('Capture send error:', e);
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
      sendingRef.current = false;
      // Reset chunks so a new recording can start fresh
      chunksRef.current = [];
      router.refresh();
    }
  };

  const onSendText = async () => {
    const content = text.trim();
    if (!content) return;
    if (sendingRef.current) return;
    setSending(true);
    sendingRef.current = true;
    setError(null);
    setLastSchema(null);
    try {
      const form = new FormData();
      form.append('text', content);
      form.append('language', 'auto');
      form.append('timezone', tz);
      form.append('date', dayKey);
      form.append('save', 'true');

      const res = await fetch('/api/capture', {
        method: 'POST',
        body: form,
        credentials: 'include',
        cache: 'no-store',
      });
      const txt = await res.text();
      let json: any = null;
      try {
        json = txt ? JSON.parse(txt) : null;
      } catch {}
      if (!res.ok) {
        const errMsg = json?.error || txt || 'Request failed';
        throw new Error(errMsg);
      }
      // Keep UI minimal after processing; rely on preview and refreshed list
      setLastSchema(json?.result ?? null);
      setText('');
    } catch (e: any) {
      console.error('Capture text send error:', e);
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
      sendingRef.current = false;
      router.refresh();
    }
  };

  return (
    <div className='flex flex-col items-center gap-4 rounded-lg border bg-card p-5 text-card-foreground'>
      <div className='flex w-full flex-col items-center gap-2'>
        <div className='font-mono text-2xl tracking-wider tabular-nums' suppressHydrationWarning>
          {nowStr || '— — : — — : — —'}
        </div>
        <div className='flex items-center justify-center gap-2'>
          <button
            type='button'
            onClick={() => pushDate(prevKey)}
            className={`rounded-md border px-3 py-1 text-center text-sm ${activeKey === prevKey ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
            aria-pressed={activeKey === prevKey}
          >
            <div className='text-[10px] text-muted-foreground'>Yesterday</div>
            <div className='font-medium'>{mmdd(prevKey)}</div>
          </button>
          <button
            type='button'
            onClick={() => pushDate(todayKey)}
            className={`rounded-md border px-3 py-1 text-center text-sm ${activeKey === todayKey ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
            aria-pressed={activeKey === todayKey}
          >
            <div className='text-[10px] text-muted-foreground'>Today</div>
            <div className='font-medium'>{mmdd(todayKey)}</div>
          </button>
          <button
            type='button'
            onClick={() => pushDate(nextKey)}
            className={`rounded-md border px-3 py-1 text-center text-sm ${activeKey === nextKey ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
            aria-pressed={activeKey === nextKey}
          >
            <div className='text-[10px] text-muted-foreground'>Tomorrow</div>
            <div className='font-medium'>{mmdd(nextKey)}</div>
          </button>
        </div>
      </div>

      {sending ? (
        <>
          <div className='relative h-24 w-24'>
            <div className='absolute inset-0 rounded-full border-2 border-primary animate-ping' />
            <div className='absolute inset-2 rounded-full border-2 border-primary/50 animate-pulse' />
            <div className='absolute inset-4 flex items-center justify-center rounded-full bg-primary/10'>
              <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
            </div>
          </div>
          <div className='text-xs text-muted-foreground text-center'>Processing audio…</div>
        </>
      ) : !recording ? (
        <>
          <Button
            aria-label='Start voice input'
            onClick={onStart}
            disabled={!supported}
            variant='outline'
            size='icon'
            className='h-16 w-16 rounded-full'
          >
            <Mic className='h-7 w-7' />
          </Button>
          <div className='text-xs text-muted-foreground text-center'>Tap the mic to record</div>
        </>
      ) : (
        <>
          <div className='text-xs text-muted-foreground text-center'>{`${Math.min(elapsed, 60)}s / 60s`}</div>
          <div className='flex items-center justify-center gap-4'>
            <Button aria-label='Cancel' variant='ghost' onClick={onCancel}>
              <X className='h-5 w-5' />
            </Button>
            <Button aria-label='Send now' onClick={onSend} disabled={sending}>
              <Send className='mr-2 h-4 w-4' />
              {sending ? 'Sending…' : 'Send Now'}
            </Button>
          </div>
        </>
      )}
      {/* Text input below mic */}
      <div className='mt-2 w-full max-w-xl'>
        <label htmlFor='quick-text' className='mb-1 block text-xs text-muted-foreground'>
          Type a task or short brief (Ctrl+Enter to send)
        </label>
        <textarea
          id='quick-text'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onSendText();
            }
          }}
          rows={3}
          placeholder='e.g. 14:00-14:30 meeting with design; submit report by 18:00'
          className='w-full resize-y rounded-md border bg-background p-2 text-sm outline-none focus:ring-1 focus:ring-ring'
          disabled={sending}
        />
        <div className='mt-2 flex items-center justify-end gap-2'>
          <Button variant='secondary' type='button' onClick={() => setText('')} disabled={sending || !text.trim()}>
            Clear
          </Button>
          <Button type='button' onClick={onSendText} disabled={sending || !text.trim()}>
            <Send className='mr-2 h-4 w-4' /> Send Text
          </Button>
        </div>
      </div>

      {/* Structured result preview */}
      {lastSchema && (
        <div className='mt-2 w-full max-w-xl rounded-md border bg-background p-3'>
          {lastSchema.tasks?.length ? (
            <ul className='space-y-2'>
              {lastSchema.tasks.map((t, i) => (
                <li key={i} className='rounded-md border p-2'>
                  <div className='font-medium'>{t.title}</div>
                  <div className='text-xs text-muted-foreground'>
                    {t.time?.type === 'range' && (t.time.startLocal || t.time.endLocal)
                      ? `${t.time.startLocal || ''}${t.time.startLocal || t.time.endLocal ? ' → ' : ''}${t.time.endLocal || ''}`
                      : t.time?.type === 'deadline' && t.time.dueLocal
                      ? `due ${t.time.dueLocal}`
                      : 'no time'}
                    {t.estimateMin ? ` • est ${t.estimateMin}m` : ''}
                    {t.priority ? ` • ${t.priority}` : ''}
                    {typeof t.confidence === 'number' ? ` • conf ${Math.round(t.confidence * 100)}%` : ''}
                  </div>
                  {t.note && <div className='mt-1 text-xs'>{t.note}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <div className='text-sm text-muted-foreground'>No tasks parsed.</div>
          )}
        </div>
      )}
      {!supported && (
        <div className='text-xs text-destructive text-center'>Your browser does not support audio capture.</div>
      )}
      {error && <div className='text-xs text-destructive text-center'>{error}</div>}
      {/* Hide extra banners; list + timeline update are clear enough */}
    </div>
  );
}
