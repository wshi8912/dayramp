'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { TaskDeleteButton } from '@/components/TaskDeleteButton';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fromUTC } from '@/libs/tz';
import { resolveCalendarTheme } from '@/utils/calendar-theme';
import { cn } from '@/utils/cn';

type Task = {
  id: string;
  title: string;
  note?: string;
  status?: string;
  startAt?: string;
  dueAt?: string;
  kind?: 'task' | 'event';
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
  const counts = useMemo(() => {
    const summary = { today: 0, tomorrow: 0, none: 0 };

    tasks.forEach((task) => {
      if (task.dueAt) {
        const dateKey = fromUTC(task.dueAt, tz).dateKey;
        if (dateKey === todayKey) summary.today += 1;
        else if (dateKey === tomorrowKey) summary.tomorrow += 1;
      } else {
        summary.none += 1;
      }
    });

    return summary;
  }, [tasks, todayKey, tomorrowKey, tz]);

  const filtered = useMemo(() => {
    if (tab === 'none') return sortedTasks.filter((t) => !t.dueAt);
    const key = tab === 'today' ? todayKey : tomorrowKey;
    return sortedTasks.filter((t) => t.dueAt && fromUTC(t.dueAt!, tz).dateKey === key);
  }, [sortedTasks, tab, todayKey, tomorrowKey, tz]);

  const countBadgeClass = (isActive: boolean) =>
    `inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'
    }`;

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            <span className='font-semibold tracking-wide'>TODO</span>
          </div>
          <TabsList className='rounded-md bg-muted/70 p-0.5'>
            <TabsTrigger
              value='today'
              className='flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium tracking-tight transition data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              <span>Today</span>
              <span className={countBadgeClass(tab === 'today')}>{counts.today}</span>
            </TabsTrigger>
            <TabsTrigger
              value='tomorrow'
              className='flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium tracking-tight transition data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              <span>Tomorrow</span>
              <span className={countBadgeClass(tab === 'tomorrow')}>{counts.tomorrow}</span>
            </TabsTrigger>
            <TabsTrigger
              value='none'
              className='flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium tracking-tight transition data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              <span>No due</span>
              <span className={countBadgeClass(tab === 'none')}>{counts.none}</span>
            </TabsTrigger>
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
                const theme = resolveCalendarTheme(t);
                const IconComponent = theme.icon;
                // Avoid SSR/client mismatches: compute time-dependent UI only after mount
                const progress = mounted && t.dueAt ? calculateProgress(t.dueAt) : null;

                return (
                  <Card
                    key={t.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => onSelect?.(t)}
                    className={cn(
                      'cursor-pointer rounded-md p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      theme.cardClass
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 truncate text-sm font-medium leading-tight'>
                        <TaskStatusBadge taskId={t.id} status={t.status} />
                        <IconComponent className={cn('h-4 w-4 shrink-0', theme.iconClass)} />
                        <span className='truncate'>{t.title}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        {progress && theme.visualKey === 'deadline' && (
                          <CircularProgress
                            progress={progress.progress}
                            color={progress.color}
                            size={16}
                          />
                        )}
                        {startTime && !t.dueAt && (
                          <Badge
                            variant='outline'
                            className={cn('shrink-0 text-[10px]', 'calendar-chip', 'calendar-chip--scheduled')}
                          >
                            {startTime} start
                          </Badge>
                        )}
                        {dueTime && (
                          <Badge
                            variant='outline'
                            className={cn(
                              'shrink-0 text-[10px]',
                              'calendar-chip',
                              progress?.overdue ? 'calendar-chip--overdue' : 'calendar-chip--deadline'
                            )}
                          >
                            {dueTime} {progress?.overdue ? 'overdue' : 'due'}
                          </Badge>
                        )}
                        <TaskDeleteButton taskId={t.id} />
                      </div>
                    </div>
                    {t.note && <div className='mt-1 truncate text-xs text-muted-foreground'>{t.note}</div>}
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
