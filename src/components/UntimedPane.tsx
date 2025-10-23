'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

import { TaskDeleteButton } from '@/components/TaskDeleteButton';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import type { StatusFilterValue } from '@/components/TaskStatusFilter';
import { TaskStatusFilter } from '@/components/TaskStatusFilter';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { normalizeTaskStatus, type TaskStatus } from '@/features/tasks/task-status';
import { TASK_STATUS_ORDER, TASK_STATUS_THEME } from '@/features/tasks/task-status-theme';
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

export function UntimedPane({
  tz,
  tasks,
  activeDateKey,
  onSelect,
}: {
  tz: string;
  tasks: Task[];
  activeDateKey: string;
  onSelect?: (t: Task) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Local day keys for filtering
  const [tab, setTab] = useState<'date' | 'none'>('date');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('todo');

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
    const summary: { date: number; none: number } = { date: 0, none: 0 };

    tasks.forEach((task) => {
      if (task.dueAt) {
        const dateKey = fromUTC(task.dueAt, tz).dateKey;
        if (dateKey === activeDateKey) summary.date += 1;
        else summary.none += 1;
      } else {
        summary.none += 1;
      }
    });

    return summary;
  }, [tasks, activeDateKey, tz]);

  const filtered = useMemo(() => {
    if (tab === 'none') {
      return sortedTasks.filter((t) => !t.dueAt || fromUTC(t.dueAt, tz).dateKey !== activeDateKey);
    }
    return sortedTasks.filter((t) => t.dueAt && fromUTC(t.dueAt, tz).dateKey === activeDateKey);
  }, [sortedTasks, tab, activeDateKey, tz]);

  const countBadgeClass = (isActive: boolean) =>
    `inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'
    }`;

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilterValue, number> = { all: filtered.length, todo: 0, pending: 0, done: 0 };
    filtered.forEach((task) => {
      const status = normalizeTaskStatus(task.status);
      counts[status as TaskStatus] += 1;
    });
    return counts;
  }, [filtered]);

  const statusFilteredTasks = useMemo(() => {
    if (statusFilter === 'all') {
      // Sort by status order: todo, pending, done
      return [...filtered].sort((a, b) => {
        const statusA = normalizeTaskStatus(a.status);
        const statusB = normalizeTaskStatus(b.status);
        const indexA = TASK_STATUS_ORDER.indexOf(statusA);
        const indexB = TASK_STATUS_ORDER.indexOf(statusB);
        return indexA - indexB;
      });
    }
    return filtered.filter((task) => normalizeTaskStatus(task.status) === statusFilter);
  }, [filtered, statusFilter]);

  const renderTaskCard = (task: Task) => {
    const startTime = formatTime(task.startAt);
    const dueTime = formatTime(task.dueAt);
    const theme = resolveCalendarTheme(task);
    const IconComponent = theme.icon;
    const progress = mounted && task.dueAt ? calculateProgress(task.dueAt) : null;
    const status = normalizeTaskStatus(task.status);
    const isDone = status === 'done';

    return (
      <Card
        key={task.id}
        role='button'
        tabIndex={0}
        onClick={() => onSelect?.(task)}
        className={cn(
          'cursor-pointer rounded-md p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          TASK_STATUS_THEME[status].cardClass,
          isDone && 'opacity-70 hover:opacity-95'
        )}
      >
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 truncate text-sm font-medium leading-tight'>
            <TaskStatusBadge taskId={task.id} status={task.status} size='sm' variant='icon' />
            <IconComponent className={cn('h-4 w-4 shrink-0', theme.iconClass)} />
            <span className='truncate'>{task.title}</span>
          </div>
          <div className='flex items-center gap-2'>
            {progress && theme.visualKey === 'deadline' && (
              <CircularProgress
                progress={progress.progress}
                color={progress.color}
                size={16}
              />
            )}
            {startTime && !task.dueAt && (
              <div className='inline-flex items-center gap-1 rounded-full bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                <Clock3 className='h-3 w-3' />
                <span>{startTime}</span>
              </div>
            )}
            {dueTime && (
              <div className='inline-flex items-center gap-1 rounded-full bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                {progress?.overdue ? (
                  <AlertTriangle className='h-3 w-3 text-red-500' />
                ) : (
                  <Clock3 className='h-3 w-3' />
                )}
                <span className='font-mono text-[11px] tabular-nums'>{dueTime}</span>
              </div>
            )}
            <TaskDeleteButton taskId={task.id} />
          </div>
        </div>
        {task.note && <div className='mt-1 truncate text-xs text-muted-foreground'>{task.note}</div>}
      </Card>
    );
  };

  const emptyMessage = useMemo(() => {
    if (statusFilter === 'todo') return 'No todo items.';
    if (statusFilter === 'pending') return 'No pending items.';
    if (statusFilter === 'done') return 'No completed items yet.';
    return 'No tasks.';
  }, [statusFilter]);

  const activeDateLabel = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return formatter.format(new Date(`${activeDateKey}T00:00:00`));
    } catch {
      return activeDateKey;
    }
  }, [activeDateKey]);

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
              value='date'
              className='flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium tracking-tight transition data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              <span>{activeDateLabel}</span>
              <span className={countBadgeClass(tab === 'date')}>{counts.date}</span>
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
        <TabsContent value={tab} className='mt-3 space-y-3'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <TaskStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              counts={statusCounts}
              className='max-sm:w-full'
            />
          </div>
          {statusFilteredTasks.length === 0 ? (
            <div className='text-sm text-muted-foreground'>{emptyMessage}</div>
          ) : (
            <div className='space-y-1.5'>
              {statusFilteredTasks.map((task) => renderTaskCard(task))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
