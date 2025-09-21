'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic, Send, X } from 'lucide-react';

export function CaptureBar() {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const router = useRouter();

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
    setResultInfo(null);
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
    stopAll();
  };

  const onSend = async () => {
    if (sending) return;
    setSending(true);
    setResultInfo(null);
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
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      form.append('file', blob, 'capture.webm');
      form.append('language', 'auto');
      form.append('timezone', tz);
      form.append('save', 'true');

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
      const tasks = json?.result?.tasks || [];
      const savedCount = json?.saved?.count ?? 0;
      if (savedCount > 0) {
        setResultInfo(`Saved ${savedCount} task(s).`);
      } else {
        setResultInfo(`Transcribed. Parsed ${tasks.length} task(s).`);
      }
      // Future: open ReviewModal and allow user to publish tasks
    } catch (e: any) {
      console.error('Capture send error:', e);
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
      // Reset chunks so a new recording can start fresh
      chunksRef.current = [];
      router.refresh();
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {!recording ? (
            <Button aria-label='Start voice input' onClick={onStart} disabled={!supported}>
              <Mic className='mr-2 h-4 w-4' />
              Voice
            </Button>
          ) : (
            <div className='flex items-center gap-2'>
              <Button aria-label='Cancel' variant='ghost' onClick={onCancel}>
                <X className='h-4 w-4' />
              </Button>
              <Button aria-label='Send now' onClick={onSend} disabled={sending}>
                <Send className='mr-2 h-4 w-4' />
                {sending ? 'Sending…' : 'Send Now'}
              </Button>
            </div>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          {recording ? `${Math.min(elapsed, 60)}s / 60s` : 'Tap the mic to record'}
        </div>
      </div>
      {!supported && (
        <div className='text-xs text-destructive'>Your browser does not support audio capture.</div>
      )}
      {error && <div className='text-xs text-destructive'>{error}</div>}
      {resultInfo && <div className='text-xs text-muted-foreground'>{resultInfo}</div>}
    </div>
  );
}
