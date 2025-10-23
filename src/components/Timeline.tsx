'use client';

import { TaskDeleteButton } from '@/components/TaskDeleteButton';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { Card } from '@/components/ui/card';
import { formatDayKey, fromUTC } from '@/libs/tz';
import { resolveCalendarTheme } from '@/utils/calendar-theme';
import { cn } from '@/utils/cn';

type Task = {
  id: string;
  title: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  note?: string;
  status?: string;
  kind: 'task' | 'event';
};

export function Timeline({
  tasks,
  tz,
  dayKey,
  onSelect,
}: {
  tasks: Task[];
  tz: string;
  dayKey: string;
  onSelect?: (t: Task) => void;
}) {
  const fmtHM = (iso?: string) => (iso ? fromUTC(iso, tz).localISO.slice(11, 16) : '');
  const timeKey = (t: Task) => t.startAt || t.dueAt || '';
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
      const isDueOnly = t.kind === 'task' && hasDue && !hasStart && !hasEnd;
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

  const dayLabel = formatDayKey(dayKey, tz).toLowerCase();

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-4 border-b border-border pb-2 text-xs text-muted-foreground'>{dayLabel}</div>

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
                    const theme = resolveCalendarTheme(t);
                    const IconComponent = theme.icon;
                    const showStatus = t.kind === 'task';

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
                          className={cn(
                            'cursor-pointer rounded-md p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            theme.cardClass
                          )}
                        >
                          <div className='flex items-center justify-between gap-3'>
                            <div className='flex items-center gap-2 min-w-0 truncate text-sm font-medium leading-tight'>
                              <IconComponent
                                className={cn('h-4 w-4 shrink-0', theme.iconClass)}
                              />
                              <span className='truncate'>{t.title}</span>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                              {showStatus && (
                                <TaskStatusBadge taskId={t.id} status={t.status} align='end' size='sm' />
                              )}
                              <TaskDeleteButton taskId={t.id} />
                              {t.startAt && t.endAt && (
                                <div className='font-mono text-[11px] tabular-nums text-muted-foreground'>
                                  {fmtHM(t.startAt)} → {fmtHM(t.endAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          {t.note && <div className='mt-1 truncate text-xs text-muted-foreground'>{t.note}</div>}
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
