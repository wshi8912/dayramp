'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, ListTodo, Mic, Send, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type SchemaTask = {
  kind: 'task' | 'event';
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
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  const parsedCount = lastSchema?.tasks?.length ?? 0;
  const previewHeader = parsedCount ? `Added ${parsedCount} ${parsedCount === 1 ? 'item' : 'items'}` : 'Awaiting structured items';
  const previewDateLabel = useMemo(() => {
    if (!lastSchema) return '';
    if (!lastSchema.date) return lastSchema.timezone;
    try {
      const label = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeZone: lastSchema.timezone,
      }).format(new Date(`${lastSchema.date}T00:00:00`));
      return `${label} • ${lastSchema.timezone}`;
    } catch {
      return `${lastSchema.date} • ${lastSchema.timezone}`;
    }
  }, [lastSchema]);

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

      {/* Mode toggle and content */}
      <div className='w-full max-w-xl'>
        <div className='flex justify-center'>
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className='h-8 p-0.5 bg-muted/70 rounded-md'>
              <TabsTrigger value='voice' className='px-3 py-1 text-xs'>Voice</TabsTrigger>
              <TabsTrigger value='text' className='px-3 py-1 text-xs'>Text</TabsTrigger>
            </TabsList>
            <TabsContent value='voice' className='mt-2'>
              {sending ? (
                <div className='flex flex-col items-center gap-2'>
                  <div className='relative h-16 w-16'>
                    <div className='absolute inset-0 rounded-full border-2 border-primary animate-ping' />
                    <div className='absolute inset-1.5 rounded-full border-2 border-primary/50 animate-pulse' />
                    <div className='absolute inset-3 flex items-center justify-center rounded-full bg-primary/10'>
                      <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    </div>
                  </div>
                  <div className='text-xs text-muted-foreground'>Processing…</div>
                </div>
              ) : !recording ? (
                <div className='flex flex-col items-center gap-2'>
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
                </div>
              ) : (
                <div className='flex w-full flex-col items-center gap-4'>
                  <div className='text-xs text-muted-foreground'>{`${Math.min(elapsed, 60)}s / 60s`}</div>
                  <div className='flex w-full max-w-xs flex-col items-center gap-3'>
                    <Button
                      aria-label='Send recording'
                      onClick={onSend}
                      disabled={sending}
                      className='w-full rounded-full py-3 text-sm font-semibold'
                    >
                      <Send className='h-4 w-4' />
                      {sending ? 'Sending…' : 'Send'}
                    </Button>
                    <Button
                      aria-label='Stop recording'
                      variant='ghost'
                      size='icon'
                      onClick={onCancel}
                      className='rounded-full border border-border/60 bg-background/60'
                    >
                      <X className='h-5 w-5' />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value='text' className='mt-2'>
              {sending ? (
                <div className='flex flex-col items-center gap-2'>
                  <div className='relative h-6 w-6'>
                    <div className='absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </div>
                  <div className='text-xs text-muted-foreground'>Processing…</div>
                </div>
              ) : (
                <div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        onSendText();
                      }
                    }}
                    rows={3}
                    placeholder='Type a task…'
                    className='w-full resize-y rounded-md border bg-background p-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                    disabled={sending}
                  />
                  <div className='mt-2 flex items-center justify-end gap-2'>
                    <Button variant='ghost' type='button' onClick={() => setText('')} disabled={sending || !text.trim()} className='h-8 px-2 text-xs'>
                      Clear
                    </Button>
                    <Button type='button' onClick={onSendText} disabled={sending || !text.trim()} className='h-8 px-3 text-xs'>
                      <Send className='mr-2 h-3.5 w-3.5' /> Send
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Structured result preview */}
      {lastSchema && (
        <div className='mt-4 w-full max-w-2xl'>
          <div className='rounded-2xl border border-muted bg-background/80 p-4 shadow-sm backdrop-blur'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-muted-foreground/10 pb-3'>
              <div>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>LLM capture preview</p>
                <p className='text-sm font-medium text-foreground'>{previewHeader}</p>
                <p className='text-xs text-muted-foreground'>{previewDateLabel || lastSchema.timezone}</p>
              </div>
              <Badge className='border-emerald-200 bg-emerald-500/15 text-emerald-600'>Added</Badge>
            </div>
            {lastSchema.tasks?.length ? (
              <ul className='mt-4 space-y-3'>
                {lastSchema.tasks.map((t, i) => {
                  const isEvent = t.kind === 'event';
                  const toTime = (value?: string) => (value ? value.slice(11, 16) : '');
                  const timeLabel = (() => {
                    if (!t.time) return 'Unscheduled';
                    if (t.time.type === 'range') {
                      const start = toTime(t.time.startLocal);
                      const end = toTime(t.time.endLocal);
                      if (start && end) return `${start} → ${end}`;
                      if (start) return `${start} start`;
                      if (end) return `Until ${end}`;
                      return 'Scheduled';
                    }
                    if (t.time.type === 'deadline') {
                      const due = toTime(t.time.dueLocal);
                      return due ? `Due ${due}` : 'Due today';
                    }
                    return 'Unscheduled';
                  })();
                  const chips: Array<{ key: string; label: string; tone: 'time' | 'estimate' | 'priority' | 'confidence' }> = [];
                  if (timeLabel) chips.push({ key: 'time', label: timeLabel, tone: 'time' });
                  if (t.estimateMin) chips.push({ key: 'estimate', label: `~${t.estimateMin}m`, tone: 'estimate' });
                  if (t.priority) {
                    const title = `${t.priority.charAt(0).toUpperCase()}${t.priority.slice(1)} priority`;
                    chips.push({ key: 'priority', label: title, tone: 'priority' });
                  }
                  if (typeof t.confidence === 'number') {
                    chips.push({
                      key: 'confidence',
                      label: `${Math.round(t.confidence * 100)}% confidence`,
                      tone: 'confidence',
                    });
                  }
                  const chipClass = (tone: 'time' | 'estimate' | 'priority' | 'confidence') => {
                    if (tone === 'time') {
                      return isEvent ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700';
                    }
                    if (tone === 'estimate') return 'bg-amber-100 text-amber-700';
                    if (tone === 'priority') return 'bg-violet-100 text-violet-700';
                    return 'bg-slate-100 text-slate-600';
                  };
                  return (
                    <li
                      key={`${t.title}-${i}`}
                      className={cn(
                        'relative overflow-hidden rounded-xl border bg-card/80 p-4 shadow-sm transition-shadow hover:shadow-md',
                        isEvent ? 'border-sky-200/80 hover:border-sky-300/80' : 'border-emerald-200/80 hover:border-emerald-300/80'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute inset-y-0 left-0 w-1 rounded-r-full',
                          isEvent ? 'bg-sky-400/80' : 'bg-emerald-500/80'
                        )}
                      />
                      <div className='flex items-start gap-3'>
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full',
                            isEvent ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'
                          )}
                        >
                          {isEvent ? <CalendarClock className='h-5 w-5' /> : <ListTodo className='h-5 w-5' />}
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <div className='text-sm font-semibold tracking-tight text-foreground'>{t.title}</div>
                              {t.note && <div className='mt-1 text-xs text-muted-foreground'>{t.note}</div>}
                            </div>
                            <Badge
                              variant='outline'
                              className={cn(
                                'uppercase tracking-wide',
                                isEvent
                                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              )}
                            >
                              {isEvent ? 'Event' : 'Task'}
                            </Badge>
                          </div>
                          {chips.length > 0 && (
                            <div className='mt-3 flex flex-wrap gap-2'>
                              {chips.map((chip) => (
                                <span
                                  key={`${chip.key}-${i}`}
                                  className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    chipClass(chip.tone)
                                  )}
                                >
                                  {chip.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className='mt-4 rounded-lg border border-dashed border-muted-foreground/30 bg-background/60 p-4 text-sm text-muted-foreground'>
                No structured tasks detected. Try adding more detail about what you need to get done.
              </div>
            )}
          </div>
        </div>
      )}
      {!supported && (
        <div className='text-xs text-destructive text-center'>Audio capture not supported.</div>
      )}
      {error && <div className='text-xs text-destructive text-center'>{error}</div>}
      {/* Hide extra banners; list + timeline update are clear enough */}
    </div>
  );
}
