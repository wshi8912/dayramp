'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fromUTC, toUTC } from '@/libs/tz';
import { patchJSON, del } from '@/libs/api';

type UITask = {
  id: string;
  title: string;
  note?: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
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
    if (task.startAt && task.endAt) return 'range';
    if (task.dueAt) return 'deadline';
    if (task.startAt) return 'range';
    return 'none';
  }, [task]);

  const [title, setTitle] = useState(task?.title || '');
  const [note, setNote] = useState(task?.note || '');
  const [timeType, setTimeType] = useState<TimeType>(initialType);
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [dueLocal, setDueLocal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(task?.title || '');
    setNote(task?.note || '');
    setTimeType(initialType);
    setStartLocal(task?.startAt ? fromUTC(task.startAt, tz).localISO : '');
    setEndLocal(task?.endAt ? fromUTC(task.endAt, tz).localISO : '');
    setDueLocal(task?.dueAt ? fromUTC(task.dueAt, tz).localISO : '');
  }, [task, tz, initialType]);

  const canSave = title.trim().length > 0 && !!task;

  const onSave = async () => {
    if (!task || !canSave || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        note: note.trim() || null,
      };
      if (timeType === 'none') {
        payload.startAt = null;
        payload.endAt = null;
        payload.dueAt = null;
      } else if (timeType === 'range') {
        payload.startAt = startLocal ? toUTC(startLocal, tz) : null;
        payload.endAt = endLocal ? toUTC(endLocal, tz) : null;
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

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
              <label className='text-sm'>Time</label>
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
      </SheetContent>
    </Sheet>
  );
}
