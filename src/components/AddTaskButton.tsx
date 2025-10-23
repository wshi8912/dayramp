'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format as formatInTimeZone } from 'date-fns-tz';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TASK_KIND_LABELS, TASK_KIND_ORDER, TaskKind } from '@/features/tasks/task-kind';
import { postJSON } from '@/libs/api';
import { toUTC } from '@/libs/tz';

type TimeType = 'none' | 'range' | 'deadline';

const END_OF_DAY_TEMPLATE = "yyyy-MM-dd'T'23:59";

const getEndOfDayLocal = (tz: string) =>
  formatInTimeZone(new Date(), END_OF_DAY_TEMPLATE, { timeZone: tz });

export function AddTaskButton({ tz }: { tz: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [timeType, setTimeType] = useState<TimeType>('deadline');
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [dueLocal, setDueLocal] = useState(() => getEndOfDayLocal(tz));
  const [kind, setKind] = useState<TaskKind>('task');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const canSave = useMemo(() => {
    if (title.trim().length === 0) return false;
    if (kind === 'event') {
      return startLocal.length > 0 && endLocal.length > 0;
    }
    if (timeType === 'range') {
      return !endLocal || startLocal.length > 0;
    }
    return true;
  }, [title, kind, timeType, startLocal, endLocal]);

  const reset = () => {
    setTitle('');
    setNote('');
    setTimeType('deadline');
    setStartLocal('');
    setEndLocal('');
    setDueLocal(getEndOfDayLocal(tz));
    setKind('task');
  };

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        note: note.trim() || null,
        source: 'manual',
        kind,
      };
      if (kind === 'event') {
        payload.status = 'pending';
        payload.startAt = toUTC(startLocal, tz);
        payload.endAt = toUTC(endLocal, tz);
        payload.dueAt = null;
      } else if (timeType === 'none') {
        payload.status = 'todo';
        payload.startAt = null;
        payload.endAt = null;
        payload.dueAt = null;
      } else if (timeType === 'range') {
        payload.status = 'todo';
        payload.startAt = startLocal ? toUTC(startLocal, tz) : null;
        payload.endAt = endLocal ? toUTC(endLocal, tz) : null;
        payload.dueAt = null;
      } else if (timeType === 'deadline') {
        payload.status = 'todo';
        payload.startAt = null;
        payload.endAt = null;
        payload.dueAt = dueLocal ? toUTC(dueLocal, tz) : null;
      }

      await postJSON('/api/tasks', payload);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      reset();
    }}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          size='icon'
          aria-label='Add Task'
          className='fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg'
        >
          <Plus className='h-7 w-7' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <div className='py-1 space-y-4'>
          <div className='flex flex-col gap-2'>
            <label className='text-sm'>Title</label>
            <Input
              placeholder='Task title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              }}
              autoFocus
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm'>Note</label>
            <textarea
              placeholder='Optional notes'
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
                    if (option === 'event') {
                      setTimeType('range');
                      setDueLocal('');
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

          <div className='flex items-center gap-2 pt-2'>
            <Button onClick={save} disabled={!canSave || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
