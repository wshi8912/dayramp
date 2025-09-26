'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fromUTC } from '@/libs/tz';
import { CheckCircle2 } from 'lucide-react';
import { Clock, Play, Circle } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  note?: string;
  status?: string;
  startAt?: string;
  dueAt?: string;
};

// Circular progress component for deadline tasks
function CircularProgress({ progress, color, size = 16 }: { progress: number; color: string; size?: number }) {
  const radius = size / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          // Render as string to keep attribute type stable
          strokeDashoffset={String(strokeDashoffset)}
          className={`transition-all duration-300 ${color}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function UntimedPane({ tz, tasks, onSelect }: { tz: string; tasks: Task[]; onSelect?: (t: Task) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Local day keys for filtering
  const { todayKey, tomorrowKey } = useMemo(() => {
    const nowUTC = new Date().toISOString();
    const { dateKey } = fromUTC(nowUTC, tz);
    const d = new Date(`${dateKey}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    const tomorrow = d.toISOString().slice(0, 10);
    return { todayKey: dateKey, tomorrowKey: tomorrow };
  }, [tz]);

  const [tab, setTab] = useState<'today' | 'tomorrow' | 'none'>('today');

  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tz,
      }).format(date);
    } catch {
      // Fallback without timezone if environment lacks ICU data
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  };

  const calculateProgress = (dueAt: string) => {
    const now = new Date();
    const due = new Date(dueAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

    // If overdue, show MAX (100%) and red for strong emphasis
    const overdue = now.getTime() > due.getTime();
    if (overdue) {
      return { progress: 100, color: 'text-red-500', overdue: true } as const;
    }

    // Otherwise, keep day-progress visualization
    const totalMs = endOfDay.getTime() - today.getTime();
    const elapsedMs = now.getTime() - today.getTime();
    const progress = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

    // Color based on remaining time to due
    const remainingHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    let color = 'text-green-500';
    if (remainingHours < 2) color = 'text-red-500';
    else if (remainingHours < 4) color = 'text-yellow-500';

    return { progress, color, overdue: false } as const;
  };

  const getTaskTypeInfo = (task: Task) => {
    if (task.dueAt && !task.startAt) {
      return {
        icon: Clock,
        color: 'border-orange-200 bg-orange-50/30',
        type: 'deadline'
      };
    } else if (task.startAt && !task.dueAt) {
      return {
        icon: Play,
        color: 'border-blue-200 bg-blue-50/30',
        type: 'start-only'
      };
    } else {
      return {
        icon: Circle,
        color: 'border-gray-200 bg-gray-50/30',
        type: 'unscheduled'
      };
    }
  };

  // Sort helper: deadline-first by ascending dueAt, then others.
  const sortedTasks: Task[] = (() => {
    const withDue = tasks.filter((t) => !!t.dueAt);
    const withoutDue = tasks.filter((t) => !t.dueAt);
    withDue.sort((a, b) => {
      const ta = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb; // earlier (including overdue) first
    });
    return [...withDue, ...withoutDue];
  })();

  // Tab-based filtering
  const filtered = useMemo(() => {
    if (tab === 'none') return sortedTasks.filter((t) => !t.dueAt);
    const key = tab === 'today' ? todayKey : tomorrowKey;
    return sortedTasks.filter((t) => t.dueAt && fromUTC(t.dueAt!, tz).dateKey === key);
  }, [sortedTasks, tab, todayKey, tomorrowKey, tz]);

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            <span className='font-semibold tracking-wide'>TODO</span>
          </div>
          <TabsList className='h-8 p-0.5 bg-muted/70 rounded-md'>
            <TabsTrigger value='today' className='px-2.5 py-1 text-xs'>Today</TabsTrigger>
            <TabsTrigger value='tomorrow' className='px-2.5 py-1 text-xs'>Tomorrow</TabsTrigger>
            <TabsTrigger value='none' className='px-2.5 py-1 text-xs'>No due</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={tab} className='mt-2'>
          {filtered.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No tasks.</div>
          ) : (
            <div className='space-y-1.5'>
              {filtered.map((t) => {
                const startTime = formatTime(t.startAt);
                const dueTime = formatTime(t.dueAt);
                const taskTypeInfo = getTaskTypeInfo(t);
                const IconComponent = taskTypeInfo.icon;
                // Avoid SSR/client mismatches: compute time-dependent UI only after mount
                const progress = mounted && t.dueAt ? calculateProgress(t.dueAt) : null;

                return (
                  <Card
                    key={t.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => onSelect?.(t)}
                    className={`cursor-pointer rounded-md p-3 shadow-sm transition-colors hover:bg-accent/30 ${taskTypeInfo.color}`}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 truncate text-sm font-medium leading-tight'>
                        <IconComponent className={`h-4 w-4 shrink-0 ${
                          taskTypeInfo.type === 'deadline' ? 'text-orange-500' :
                          taskTypeInfo.type === 'start-only' ? 'text-blue-500' :
                          'text-gray-400'
                        }`} />
                        <span className='truncate'>{t.title}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        {progress && taskTypeInfo.type === 'deadline' && (
                          <CircularProgress
                            progress={progress.progress}
                            color={progress.color}
                            size={16}
                          />
                        )}
                        {startTime && !t.dueAt && (
                          <Badge variant='outline' className='shrink-0 text-[10px]'>
                            {startTime} start
                          </Badge>
                        )}
                        {dueTime && (
                          <Badge
                            variant='outline'
                            className={`shrink-0 text-[10px] ${
                              progress?.overdue ? 'text-red-600 border-red-300 bg-red-50' : 'text-orange-600 border-orange-300'
                            }`}
                          >
                            {dueTime} {progress?.overdue ? 'overdue' : 'due'}
                          </Badge>
                        )}
                        {t.status && (
                          <Badge variant='secondary' className='shrink-0 text-[10px] uppercase'>
                            {t.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {t.note && <div className='mt-1 truncate text-xs text-gray-600'>{t.note}</div>}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
