'use client';

import { fromUTC } from '@/libs/tz';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const sorted = [...tasks].sort((a, b) => {
    const ta = timeKey(a);
    const tb = timeKey(b);
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

  // Time scale ticks from 05:00 to 24:00 (inclusive)
  const tickLabels = Array.from({ length: 20 }, (_, i) => {
    const h = i + 5; // 5..24
    return h < 24 ? `${String(h).padStart(2, '0')}:00` : '24:00';
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

      <div className='grid grid-cols-[5rem_1fr] gap-2'>
        {/* Left time ticks from 05:00 to 24:00 */}
        <div className='relative'>
          <ul className='flex select-none flex-col text-[11px] font-mono leading-6 text-muted-foreground/80'>
            {tickLabels.map((label) => (
              <li key={label} className='relative flex h-7 items-center justify-end pr-2 tabular-nums'>
                {label}
                {/* small tick mark at the boundary */}
                <span className='pointer-events-none absolute right-[-1px] top-1/2 h-px w-2 -translate-y-1/2 bg-border' />
              </li>
            ))}
          </ul>
          {/* divider at the right edge */}
          <div className='pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-border' />
        </div>

        {/* Tasks column */}
        {sorted.length === 0 ? (
          <div className='py-2 text-sm text-muted-foreground'>No timed tasks yet.</div>
        ) : (
          <div className='relative'>
            {/* vertical rail aligned with dots (after 4rem label = left-20) */}
            <div className='pointer-events-none absolute left-20 top-0 bottom-0 w-0.5 bg-border' />

            <ul>
              {groups.map((g, gi) => {
                const first = g[0];
                const leftLabel = first.label;
                const anyDueOnly = g.every((x) => x.isDueOnly);
                // choose dot color by first task (keeps semantics close to original)
                const dotColor = first.task.status === 'done'
                  ? 'bg-muted-foreground'
                  : first.isDueOnly
                  ? 'bg-amber-500'
                  : 'bg-primary';

                return (
                  <li key={`grp-${gi}`} className='relative mb-3 pl-28'>
                    {/* left time label per overlapping group */}
                    {leftLabel && (
                      <span className='absolute left-0 top-1.5 w-16 pr-2 text-right font-mono text-[11px] tabular-nums text-muted-foreground'>
                        {leftLabel}
                      </span>
                    )}
                    {/* dot aligned with the first item time */}
                    <span className={`absolute left-20 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-background ${dotColor}`} />

                    {/* Stacked cards with slight right shift when overlapping */}
                    <div>
                      {g.map(({ task: t, isDueOnly }, idx) => {
                        const shiftX = idx * 12; // px per stacked layer
                        const overlapLift = idx === 0 ? 0 : 8; // px to overlap upward for visual stacking
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
                              className={`cursor-pointer p-3 shadow-sm transition-colors hover:bg-accent/30 ${isDueOnly ? 'opacity-90' : ''}`}
                            >
                              <div className='flex items-center justify-between gap-3'>
                                <div className='min-w-0 truncate text-sm font-medium leading-tight'>
                                  <span className='truncate'>{t.title}</span>
                                  {t.status && (
                                    <Badge variant='secondary' className='ml-2 align-middle text-[10px] uppercase'>
                                      {t.status}
                                    </Badge>
                                  )}
                                </div>
                                {t.startAt && t.endAt && (
                                  <div className='shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground'>
                                    {fmtHM(t.startAt)} → {fmtHM(t.endAt)}
                                  </div>
                                )}
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
          </div>
        )}
      </div>
    </div>
  );
}
