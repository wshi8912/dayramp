'use client';

import { Clock, Circle, Play } from 'lucide-react';

import { TaskDeleteButton } from '@/components/TaskDeleteButton';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { Card } from '@/components/ui/card';
import { fromUTC } from '@/libs/tz';

type Task = {
  id: string;
  title: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  note?: string;
  status?: string;
};

export function Timeline({ tasks, tz, onSelect }: { tasks: Task[]; tz: string; onSelect?: (t: Task) => void }) {
  const fmt = (iso?: string) => (iso ? fromUTC(iso, tz).localISO.replace('T', ' ') : '');
  const fmtHM = (iso?: string) => (iso ? fromUTC(iso, tz).localISO.slice(11, 16) : '');
  const timeKey = (t: Task) => t.startAt || t.dueAt || '';

  const getTaskTypeInfo = (task: Task) => {
    if (task.dueAt && !task.startAt) {
      return {
        icon: Clock,
        color: 'border-orange-200 bg-orange-50/30',
        type: 'deadline'
      };
    } else if (task.startAt && task.endAt) {
      return {
        icon: Play,
        color: 'border-blue-200 bg-blue-50/30',
        type: 'scheduled'
      };
    } else if (task.startAt && !task.endAt) {
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
  const sorted = [...tasks].sort((a, b) => {
    const ta = timeKey(a);
    const tb = timeKey(b);
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

  // Helpers for overlap grouping (in local TZ minutes)
  const toMinutes = (iso?: string) => {
    if (!iso) return null;
    const s = fromUTC(iso, tz).localISO.slice(11, 16); // HH:MM
    const hh = Number(s.slice(0, 2));
    const mm = Number(s.slice(3, 5));
    return hh * 60 + mm;
  };

  type TWithSpan = {
    task: Task;
    startMin: number; // minutes since 00:00
    endMin: number; // inclusive end minute (fallback to startMin)
    label: string; // left label (start or due)
    isDueOnly: boolean;
  };

  const withSpans: TWithSpan[] = sorted
    .map((t) => {
      const hasStart = !!t.startAt;
      const hasEnd = !!t.endAt;
      const hasDue = !!t.dueAt;
      const startMin = hasStart ? toMinutes(t.startAt)! : hasDue ? toMinutes(t.dueAt)! : 0;
      const endMin = hasStart && hasEnd ? toMinutes(t.endAt)! : startMin;
      const isDueOnly = hasDue && !hasStart && !hasEnd;
      const label = hasStart ? fmtHM(t.startAt) : hasDue ? `due ${fmtHM(t.dueAt)}` : '';
      return { task: t, startMin, endMin, label, isDueOnly };
    })
    // guard against any items that couldn't be parsed
    .filter((x) => Number.isFinite(x.startMin) && Number.isFinite(x.endMin));

  // Group consecutive items that overlap in time.
  // Assumes input is sorted by start time (or due time fallback)
  const groups: TWithSpan[][] = [];
  for (const item of withSpans) {
    const g = groups[groups.length - 1];
    if (!g) {
      groups.push([item]);
      continue;
    }
    const currentGroupEnd = Math.max(...g.map((x) => x.endMin));
    if (item.startMin <= currentGroupEnd) {
      g.push(item);
    } else {
      groups.push([item]);
    }
  }

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-2 text-xs text-muted-foreground'>Timeline</div>

      {sorted.length === 0 ? (
        <div className='py-2 text-sm text-muted-foreground'>No timed tasks yet.</div>
      ) : (
        <ul className='space-y-4'>
          {groups.map((g, gi) => {
            const first = g[0];
            const leftLabel = first.label;

            return (
              <li key={`grp-${gi}`} className='relative'>
                {leftLabel && (
                  <div className='mb-2 text-[11px] font-mono tabular-nums text-muted-foreground'>
                    {leftLabel}
                  </div>
                )}

                <div className='relative'>
                  {g.map(({ task: t, isDueOnly }, idx) => {
                    const shiftX = idx * 12; // px per stacked layer
                    const overlapLift = idx === 0 ? 0 : 8; // px to overlap upward for visual stacking
                    const taskTypeInfo = getTaskTypeInfo(t);
                    const IconComponent = taskTypeInfo.icon;

                    return (
                      <div
                        key={t.id}
                        className={idx === 0 ? '' : '-mt-2'}
                        style={{ marginLeft: shiftX }}
                      >
                        <Card
                          role='button'
                          tabIndex={0}
                          onClick={() => onSelect?.(t)}
                          style={{ zIndex: idx + 1, position: 'relative', top: -overlapLift }}
                          className={`cursor-pointer rounded-md p-3 shadow-sm transition-colors hover:bg-accent/30 ${taskTypeInfo.color} ${isDueOnly ? 'opacity-90' : ''}`}
                        >
                          <div className='flex items-center justify-between gap-3'>
                            <div className='flex items-center gap-2 min-w-0 truncate text-sm font-medium leading-tight'>
                              <IconComponent
                                className={`h-4 w-4 shrink-0 ${
                                  taskTypeInfo.type === 'deadline' ? 'text-orange-500' :
                                  taskTypeInfo.type === 'scheduled' || taskTypeInfo.type === 'start-only' ? 'text-blue-500' :
                                  'text-gray-400'
                                }`}
                              />
                              <span className='truncate'>{t.title}</span>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                              <TaskStatusBadge taskId={t.id} status={t.status} align='end' />
                              <TaskDeleteButton taskId={t.id} />
                              {t.startAt && t.endAt && (
                                <div className='font-mono text-[11px] tabular-nums text-muted-foreground'>
                                  {fmtHM(t.startAt)} → {fmtHM(t.endAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          {t.note && <div className='mt-1 truncate text-xs text-gray-600'>{t.note}</div>}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
