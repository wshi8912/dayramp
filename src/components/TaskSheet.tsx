'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { normalizeTaskKind, TASK_KIND_LABELS, TASK_KIND_ORDER, TaskKind } from '@/features/tasks/task-kind';
import {
  normalizeTaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TaskStatus,
} from '@/features/tasks/task-status';
import { del, patchJSON } from '@/libs/api';
import { fromUTC, toUTC } from '@/libs/tz';

type UITask = {
  id: string;
  title: string;
  note?: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  status?: string;
  kind?: 'task' | 'event';
};

type TimeType = 'none' | 'range' | 'deadline';

export function TaskSheet({
  open,
  onOpenChange,
  task,
  tz,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: UITask;
  tz: string;
  onSaved?: () => void;
}) {
  const initialType: TimeType = useMemo(() => {
    if (!task) return 'none';
    if (task.kind === 'event') return 'range';
    if (task.startAt && task.endAt) return 'range';
    if (task.dueAt) return 'deadline';
    if (task.startAt) return 'range';
    return 'none';
  }, [task]);

  const [title, setTitle] = useState(task?.title || '');
  const [note, setNote] = useState(task?.note || '');
  const [timeType, setTimeType] = useState<TimeType>(initialType);
  const [status, setStatus] = useState<TaskStatus>(() => normalizeTaskStatus(task?.status));
  const [kind, setKind] = useState<TaskKind>(() => normalizeTaskKind(task?.kind));
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [dueLocal, setDueLocal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(task?.title || '');
    setNote(task?.note || '');
    setTimeType(initialType);
    setStatus(normalizeTaskStatus(task?.status));
    setKind(normalizeTaskKind(task?.kind));
    setStartLocal(task?.startAt ? fromUTC(task.startAt, tz).localISO : '');
    setEndLocal(task?.endAt ? fromUTC(task.endAt, tz).localISO : '');
    setDueLocal(task?.dueAt ? fromUTC(task.dueAt, tz).localISO : '');
  }, [task, tz, initialType]);

  useEffect(() => {
    if (kind === 'event') {
      setTimeType('range');
      setDueLocal('');
    }
  }, [kind]);

  useEffect(() => {
    if (kind === 'event' && status === 'todo') {
      setStatus('pending');
    }
  }, [kind, status]);

  const canSave = useMemo(() => {
    if (!task) return false;
    if (title.trim().length === 0) return false;
    if (kind === 'event') {
      return !!startLocal && !!endLocal;
    }
    if (timeType === 'range') {
      return !endLocal || !!startLocal;
    }
    return true;
  }, [task, title, kind, startLocal, endLocal, timeType]);

  const onSave = async () => {
    if (!task || !canSave || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        note: note.trim() || null,
        status,
        kind,
      };
      if (kind === 'event') {
        if (!startLocal || !endLocal) {
          alert('Events require both start and end times');
          setSaving(false);
          return;
        }
        payload.startAt = toUTC(startLocal, tz);
        payload.endAt = toUTC(endLocal, tz);
        payload.dueAt = null;
      } else if (timeType === 'none') {
        payload.startAt = null;
        payload.endAt = null;
        payload.dueAt = null;
      } else if (timeType === 'range') {
        // Validation: end_at cannot exist without start_at
        if (!startLocal && endLocal) {
          alert('End time cannot be set without a start time');
          setSaving(false);
            return;
        }
        payload.startAt = startLocal ? toUTC(startLocal, tz) : null;
        // Only set endAt if startAt exists
        payload.endAt = (startLocal && endLocal) ? toUTC(endLocal, tz) : null;
        payload.dueAt = null;
      } else if (timeType === 'deadline') {
        payload.startAt = null;
        payload.endAt = null;
        payload.dueAt = dueLocal ? toUTC(dueLocal, tz) : null;
      }
      await patchJSON(`/api/tasks/${task.id}`, payload);
      onSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!task) return;
    try {
      await del(`/api/tasks/${task.id}`);
      onSaved?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        {!task ? (
          <div className='py-6 text-sm text-muted-foreground'>Select a task to edit.</div>
        ) : (
          <div className='py-4 space-y-4'>
            <div className='flex flex-col gap-2'>
              <label className='text-sm'>Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm'>Note</label>
              <textarea
                className='min-h-[96px] rounded-md border bg-background p-2'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm'>Type</label>
              <div className='flex gap-2'>
                {TASK_KIND_ORDER.map((option) => (
                  <Button
                    key={option}
                    type='button'
                    variant={kind === option ? 'default' : 'outline'}
                    onClick={() => {
                      setKind(option);
                      if (option === 'event' && status === 'todo') {
                        setStatus('pending');
                      }
                    }}
                  >
                    {TASK_KIND_LABELS[option]}
                  </Button>
                ))}
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm'>Time</label>
              {kind === 'event' ? (
                <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-xs text-muted-foreground'>Start ({tz})</label>
                    <Input type='datetime-local' value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <label className='text-xs text-muted-foreground'>End ({tz})</label>
                    <Input type='datetime-local' value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
                  </div>
                </div>
              ) : (
                <>
                  <div className='flex gap-2'>
                    <Button type='button' variant={timeType === 'none' ? 'default' : 'outline'} onClick={() => setTimeType('none')}>None</Button>
                    <Button type='button' variant={timeType === 'range' ? 'default' : 'outline'} onClick={() => setTimeType('range')}>Range</Button>
                    <Button type='button' variant={timeType === 'deadline' ? 'default' : 'outline'} onClick={() => setTimeType('deadline')}>Deadline</Button>
                  </div>
                  {timeType === 'range' && (
                    <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                      <div className='flex flex-col gap-2'>
                        <label className='text-xs text-muted-foreground'>Start ({tz})</label>
                        <Input type='datetime-local' value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <label className='text-xs text-muted-foreground'>End ({tz})</label>
                        <Input type='datetime-local' value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {timeType === 'deadline' && (
                    <div className='flex flex-col gap-2'>
                      <label className='text-xs text-muted-foreground'>Due ({tz})</label>
                      <Input type='datetime-local' value={dueLocal} onChange={(e) => setDueLocal(e.target.value)} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm'>Status</label>
              <div className='flex flex-wrap gap-2'>
                {TASK_STATUSES.map((value) => (
                  <Button
                    key={value}
                    type='button'
                    variant={status === value ? 'default' : 'outline'}
                    onClick={() => setStatus(value)}
                  >
                    {TASK_STATUS_LABELS[value]}
                  </Button>
                ))}
              </div>
            </div>

            <div className='flex items-center gap-2 pt-2'>
              <Button onClick={onSave} disabled={!canSave || saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Close</Button>
              <Button type='button' variant='destructive' onClick={onDelete}>Delete</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
