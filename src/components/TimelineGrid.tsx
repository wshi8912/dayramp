'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TaskDeleteButton } from '@/components/TaskDeleteButton';
import { Card } from '@/components/ui/card';
import { formatDayKey, fromUTC, toUTC } from '@/libs/tz';
import { resolveCalendarTheme } from '@/utils/calendar-theme';
import { cn } from '@/utils/cn';

export type Task = {
  id: string;
  title: string;
  startAt?: string;
  endAt?: string;
  dueAt?: string;
  note?: string;
  status?: string;
  kind: 'task' | 'event';
};

export type TimelineGridProps = {
  tasks: Task[];
  tz: string;
  dayKey: string; // YYYY-MM-DD in user's TZ
  stepMin?: number; // grid step
  defaultDurationMin?: number; // for click-to-create
  dayStartHour?: number; // visible window start hour
  dayEndHour?: number; // visible window end hour
  density?: 'expanded' | 'compact';
  onSelect?: (t: Task) => void;
  onCreate?: (startUtcISO: string, endUtcISO: string) => void;
};

type Span = {
  id: string;
  src: Task;
  startMin: number; // minutes since 00:00 local
  endMin: number; // minutes since 00:00 local, >= startMin
};

type Layout = {
  col: number;
  group: number;
};

export function TimelineGrid({
  tasks,
  tz,
  dayKey,
  stepMin = 30,
  defaultDurationMin = 30,
  dayStartHour = 5,
  dayEndHour = 24,
  density = 'expanded',
  onSelect,
  onCreate,
}: TimelineGridProps) {
  // Visual scale
  // Vertical scale per minute. Compact is 90% of previous compact (0.85 -> 0.765).
  const PX_PER_MIN = density === 'compact' ? 0.765 : 2; // compact (1h≈45.9px), expanded: 2px/min (1h=120px)
  // Define visible window in hours, then convert to minutes (avoid unit mixups)
  const startHour = Math.max(0, Math.min(24, dayStartHour));
  const endHour = Math.max(startHour + 1, Math.min(24, dayEndHour)); // ensure at least 1 hour
  const VISIBLE_START_MIN = startHour * 60;
  const VISIBLE_END_MIN = endHour * 60;
  const EXTRA_AFTER_MIDNIGHT_MIN = 120; // keep cards near 24:00 fully visible by extending view to +2h
  const paddedVisibleEndMin = VISIBLE_END_MIN + EXTRA_AFTER_MIDNIGHT_MIN;
  const paddedVisibleTotalMin = Math.max(1, paddedVisibleEndMin - VISIBLE_START_MIN);
  const paddedEndHour = Math.ceil(paddedVisibleEndMin / 60);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const MIN_BLOCK_MINUTES = 30;

  // Current time indicator
  const [currentMin, setCurrentMin] = useState<number | null>(null);
  const currentLabel = useMemo(() => {
    if (currentMin === null) return '';
    const hh = String(Math.floor(currentMin / 60)).padStart(2, '0');
    const mm = String(currentMin % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [currentMin]);

  const dayLabel = useMemo(() => formatDayKey(dayKey, tz).toLowerCase(), [dayKey, tz]);

  const fmtHM = useCallback(
    (iso?: string) => (iso ? fromUTC(iso, tz).localISO.slice(11, 16) : ''),
    [tz]
  );

  useEffect(() => {
    const updateCurrentTime = () => {
      const nowUTC = new Date().toISOString();
      const nowLocal = fromUTC(nowUTC, tz);

      // Only show if it's today
      if (nowLocal.dateKey === dayKey) {
        const localTime = nowLocal.localISO.slice(11, 16); // HH:MM
        const hh = Number(localTime.slice(0, 2));
        const mm = Number(localTime.slice(3, 5));
        const minutes = hh * 60 + mm;
        setCurrentMin(minutes);
      } else {
        setCurrentMin(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [tz, dayKey]);

  const minOfDayFromLocalISO = useCallback((localISO: string) => {
    const s = localISO.slice(11, 16); // HH:MM
    const hh = Number(s.slice(0, 2));
    const mm = Number(s.slice(3, 5));
    return hh * 60 + mm;
  }, []);

  const spans = useMemo<Span[]>(() => {
    const arr: Span[] = [];
    for (const t of tasks) {
      const sInfo = t.startAt ? fromUTC(t.startAt, tz) : undefined;
      const eInfo = t.endAt ? fromUTC(t.endAt, tz) : undefined;
      const dInfo = t.dueAt ? fromUTC(t.dueAt, tz) : undefined;

      if (t.kind === 'event') {
        if (!sInfo || !eInfo) continue;
        const sDay = sInfo.dateKey;
        const eDay = eInfo.dateKey;
        const sMin = minOfDayFromLocalISO(sInfo.localISO);
        const eMin = minOfDayFromLocalISO(eInfo.localISO);
        const overlaps = sDay === dayKey || eDay === dayKey || (sDay < dayKey && eDay > dayKey);
        if (!overlaps) continue;
        const startMin = sDay < dayKey ? 0 : sDay > dayKey ? 24 * 60 : Math.max(0, Math.min(24 * 60, sMin));
        const endMin = eDay > dayKey ? 24 * 60 : eDay < dayKey ? 0 : Math.max(0, Math.min(24 * 60, eMin));
        if (endMin <= startMin) continue;
        arr.push({ id: t.id, src: t, startMin, endMin });
        continue;
      }

      // Due-only marker: include only if due date is dayKey
      if (!sInfo && !eInfo && dInfo) {
        if (dInfo.dateKey !== dayKey) continue;
        const m = minOfDayFromLocalISO(dInfo.localISO);
        const startMin = Math.max(0, Math.min(24 * 60, m));
        const endMin = Math.min(24 * 60, startMin + MIN_BLOCK_MINUTES);
        arr.push({ id: t.id, src: t, startMin, endMin });
        continue;
      }

      // Range (start..end) or start-only
      if (sInfo) {
        let sDay = sInfo.dateKey;
        let sMin = minOfDayFromLocalISO(sInfo.localISO);
        let eDay: string;
        let eMin: number;

        if (eInfo) {
          eDay = eInfo.dateKey;
          eMin = minOfDayFromLocalISO(eInfo.localISO);

          const overlaps = sDay === dayKey || eDay === dayKey || (sDay < dayKey && eDay > dayKey);
          if (!overlaps) continue;

          // Clip to day window [0, 1440]
          const startMin = sDay < dayKey ? 0 : sDay > dayKey ? 24 * 60 : sMin;
          const endMin = eDay > dayKey ? 24 * 60 : eDay < dayKey ? 0 : eMin;
          const clippedStart = Math.max(0, Math.min(24 * 60, startMin));
          const clippedEnd = Math.max(0, Math.min(24 * 60, endMin));
          if (clippedEnd <= clippedStart) continue;
          const displayEnd = Math.max(
            clippedEnd,
            Math.min(24 * 60, clippedStart + MIN_BLOCK_MINUTES)
          );
          arr.push({ id: t.id, src: t, startMin: clippedStart, endMin: displayEnd });
        } else {
          // Start-only tasks do not produce calendar blocks
          continue;
        }
      }
    }
    // Sort by start; for equal start, longer first to stabilize layout
    arr.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
    return arr;
  }, [tasks, tz, dayKey, minOfDayFromLocalISO]);

  const { layout, groupCols } = useMemo(() => {
    const active: { id: string; endMin: number; col: number }[] = [];
    const freeCols: number[] = [];
    const layout: Record<string, Layout> = {};
    let group = -1;

    for (const ev of spans) {
      active.sort((a, b) => a.endMin - b.endMin);
      while (active.length && active[0].endMin <= ev.startMin) {
        const out = active.shift()!;
        freeCols.push(out.col);
      }
      if (active.length === 0) {
        group += 1;
        freeCols.length = 0;
      }
      const col = freeCols.length ? freeCols.shift()! : active.length;
      active.push({ id: ev.id, endMin: ev.endMin, col });
      layout[ev.id] = { col, group };
    }

    const groupCols: Record<number, number> = {};
    for (const ev of spans) {
      const l = layout[ev.id];
      groupCols[l.group] = Math.max(groupCols[l.group] ?? 0, l.col + 1);
    }
    return { layout, groupCols };
  }, [spans]);

  const formatHourLabel = useCallback((hour: number) => {
    if (hour < 24) {
      return `${String(hour).padStart(2, '0')}:00`;
    }
    const baseHour = hour % 24;
    const daysAhead = Math.floor(hour / 24);
    return `${String(baseHour).padStart(2, '0')}:00 +${daysAhead}`;
  }, []);

  const hourRows = useMemo(() => {
    const list: { label: string; min: number }[] = [];
    for (let hour = startHour; hour < paddedEndHour; hour += 1) {
      list.push({ label: formatHourLabel(hour), min: hour * 60 });
    }
    return list;
  }, [formatHourLabel, startHour, paddedEndHour]);

  const hourMarks = useMemo(() => {
    const mins: number[] = [];
    for (let hour = startHour; hour <= paddedEndHour; hour += 1) {
      mins.push(hour * 60);
    }
    if (!mins.includes(paddedVisibleEndMin)) {
      mins.push(paddedVisibleEndMin);
    }
    return mins;
  }, [startHour, paddedEndHour, paddedVisibleEndMin]);

  const onGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCreate) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutesFromTop = y / PX_PER_MIN; // relative to visible start
      let absoluteMin = Math.round(minutesFromTop / stepMin) * stepMin + VISIBLE_START_MIN;
      absoluteMin = Math.max(0, Math.min(24 * 60, absoluteMin));
      const hh = String(Math.floor(absoluteMin / 60)).padStart(2, '0');
      const mm = String(absoluteMin % 60).padStart(2, '0');
      const startLocal = `${dayKey}T${hh}:${mm}`;
      const endLocalMin = Math.min(24 * 60, absoluteMin + defaultDurationMin);
      const eh = String(Math.floor(endLocalMin / 60)).padStart(2, '0');
      const em = String(endLocalMin % 60).padStart(2, '0');
      const endLocal = `${dayKey}T${eh}:${em}`;
      const startUtc = toUTC(startLocal, tz);
      const endUtc = toUTC(endLocal, tz);
      onCreate(startUtc, endUtc);
    },
    [onCreate, PX_PER_MIN, stepMin, VISIBLE_START_MIN, dayKey, defaultDurationMin, tz]
  );

  return (
    <div className='rounded-lg border bg-card p-3 text-card-foreground'>
      <div className='mb-4 border-b border-border pb-2 text-xs text-muted-foreground'>{dayLabel}</div>
      <div className='grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr] gap-2'>
        {/* Left hour labels */}
        <div className='relative select-none'>
          <ul className='flex flex-col text-[11px] font-mono font-medium leading-6 text-foreground'>
            {hourRows.map((h) => (
              <li
                key={`lab-${h.min}`}
                className='relative flex items-start justify-end pr-4 md:pr-2 tabular-nums'
                style={{ height: 60 * PX_PER_MIN }}
              >
                {/* Center the label on the tick line */}
                <span className='absolute right-1 md:right-2 top-0 -translate-y-1/2 leading-none'>
                  {h.label}
                </span>
                <span className='pointer-events-none absolute right-[-1px] top-0 h-px w-2 bg-border' />
              </li>
            ))}
          </ul>
          <div className='pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-border' />
        </div>

        {/* Grid + events */}
        <div className='relative'>
          {/* Current time label - positioned outside grid container to avoid overflow:hidden clipping */}
          {currentMin !== null &&
           currentMin >= VISIBLE_START_MIN &&
           currentMin <= VISIBLE_END_MIN && (
            <div
              className='absolute left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium bg-background text-rose-700 border border-rose-300 shadow-sm z-30 pointer-events-none'
              style={{
                top: (currentMin - VISIBLE_START_MIN) * PX_PER_MIN + 2, // +2px below the line
              }}
            >
              {currentLabel}
            </div>
          )}

          {/* Grid background */}
          <div
            ref={containerRef}
            onClick={onGridClick}
            className='relative rounded-md border bg-card'
            style={{ height: paddedVisibleTotalMin * PX_PER_MIN, overflow: 'hidden' }}
          >
            {/* Hour lines */}
            {hourMarks.map((min) => {
              const top = (min - VISIBLE_START_MIN) * PX_PER_MIN;
              return (
                <div key={`hl-${min}`} className='absolute left-0 right-0 h-px bg-border' style={{ top }} />
              );
            })}
            {/* Half-hour minor lines */}
            {hourRows.map((h) => {
              const top = (h.min + 30 - VISIBLE_START_MIN) * PX_PER_MIN;
              if (h.min + 30 > paddedVisibleEndMin) return null;
              return (
                <div key={`ml-${h.min}`} className='absolute left-0 right-0 h-px bg-muted' style={{ top, opacity: 0.4 }} />
              );
            })}

            {/* Current time indicator */}
            {currentMin !== null &&
             currentMin >= VISIBLE_START_MIN &&
             currentMin <= VISIBLE_END_MIN && (
              <div
                className='absolute left-0 right-0 h-0.5 bg-rose-500 z-30 pointer-events-none'
                style={{
                  top: (currentMin - VISIBLE_START_MIN) * PX_PER_MIN,
                  boxShadow: '0 0 6px rgba(244, 63, 94, 0.55)'
                }}
              >
                {/* Small circular marker at the left edge */}
                <div className='absolute -left-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-rose-500' />
              </div>
            )}

            {/* Events */}
            {spans.map((ev) => {
              const l = layout[ev.id];
              const cols = Math.max(1, groupCols[l.group] ?? 1);
              const leftPct = (l.col / cols) * 100;
              const widthPct = (1 / cols) * 100;
              const top = (ev.startMin - VISIBLE_START_MIN) * PX_PER_MIN;
              const minBlockHeight = MIN_BLOCK_MINUTES * PX_PER_MIN;
              const height = Math.max(minBlockHeight, (ev.endMin - ev.startMin) * PX_PER_MIN);
              const t = ev.src;
              const isDueOnly = !!t.dueAt && !t.startAt && !t.endAt;
              const isOverdue = isDueOnly && t.dueAt ? (new Date(t.dueAt).getTime() < Date.now()) : false;
              const theme = resolveCalendarTheme(t);
              const IconComponent = theme.icon;
              const isDone = t.status === 'done';
              const dueTimeLabel = isDueOnly && t.dueAt ? fmtHM(t.dueAt) : '';
              const timeLabel = t.startAt && t.endAt
                ? `${fmtHM(t.startAt)} → ${fmtHM(t.endAt)}`
                : t.startAt
                  ? fmtHM(t.startAt)
                  : '';
              return (
                <div
                  key={ev.id}
                  className='absolute px-1'
                  style={{ top, left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
                >
                  <Card
                    role='button'
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(t);
                    }}
                    className={cn(
                      'relative cursor-pointer rounded-md',
                      density === 'compact' ? 'p-0 px-1' : 'p-2',
                      'shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      theme.cardClass,
                      isDone && 'opacity-70 hover:opacity-95',
                      isDueOnly && isOverdue && 'ring-1 ring-red-400/60 ring-offset-1 ring-offset-background'
                    )}
                    style={{ height }}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div
                        className={cn(
                          'flex items-center gap-1 min-w-0 truncate font-medium leading-tight',
                          density === 'compact' ? 'text-xs' : 'text-sm'
                        )}
                      >
                        <IconComponent
                          className={cn(
                            'shrink-0',
                            density === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3',
                            theme.iconClass
                          )}
                        />
                        <span className='truncate'>{t.title}</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        {dueTimeLabel ? (
                          <div
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                              theme.chipClass,
                              density === 'compact' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                            )}
                          >
                            <span className='uppercase tracking-wide opacity-80'>Due</span>
                            <span className='font-mono text-[11px] tabular-nums'>{dueTimeLabel}</span>
                          </div>
                        ) : timeLabel && (
                          <div className='font-mono text-[11px] tabular-nums opacity-80'>
                            {timeLabel}
                          </div>
                        )}
                        <TaskDeleteButton taskId={t.id} size='xs' />
                      </div>
                    </div>
                    {density !== 'compact' && t.note && (
                      <div className='mt-1 truncate text-xs opacity-80'>{t.note}</div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
