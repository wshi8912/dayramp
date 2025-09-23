# Timeline Grid (Google Calendar-like) — Design

This document proposes a clean, testable implementation for a grid-based timeline UI (similar to Google Calendar) on the core page. It replaces the current stacked-list visualization with a time grid where users can click to create a scheduled task starting at the clicked time.

## Goals
- Show the day as a vertical time grid with hour and sub-hour ticks.
- Render timed tasks positioned by start/end times, with overlap handled predictably.
- Allow click-to-create (and optional drag-to-select) to prefill start/end in `TaskSheet`.
- Respect user timezone and DST edge cases.
- Keep the implementation modular, typed, and easy to test.

## Scope
- New component: `TimelineGrid` (keeps existing `Timeline` intact for fallback).
- Integrates with existing `TaskSheet` and `tz` helpers.
- Adds layout algorithm for overlapping events.
- Adds interaction for click-to-create (drag selection as optional v2).

## UX Overview
- Left column: hour labels (e.g., 00:00–24:00 or configurable range). Minor lines at 15/30-minute intervals.
- Main pane: grid with horizontal lines per time step; a thin red “now” line for current time.
- Events: absolute-positioned cards placed by minute offsets; overlapping events share width (side-by-side) like Google Calendar.
- Click empty grid: open `TaskSheet` prefilled with `startAt` (snapped to step) and `endAt = start + defaultDuration`.
- Optional: drag to define duration; keyboard arrow nudge to adjust selection.

## Component API
```ts
// src/components/TimelineGrid.tsx
export type TimelineGridProps = {
  tasks: Task[];      // same shape as current timeline tasks
  tz: string;         // IANA timezone (e.g., 'Asia/Tokyo')
  dayKey: string;     // 'YYYY-MM-DD' (user-local day)
  stepMin?: number;   // grid step minutes (default 30)
  defaultDurationMin?: number; // on create (default 30)
  dayStartHour?: number; // e.g., 5 (optional)
  dayEndHour?: number;   // e.g., 24 (optional)
  onSelect?: (t: Task) => void; // open existing
  onCreate?: (startUtcISO: string, endUtcISO: string) => void; // create
};
```

- `onCreate` typically opens `TaskSheet` with these prefilled values.
- Defaults preserve the current 05:00–24:00 window if desired, but can be full-day.

## Data & TZ Conversions
- Use `fromUTC(utcISO, tz)` to map to local time for layout.
- Use `toUTC(localISO, tz)` to persist newly created times.
- Compute minutes-from-day-start based on `dayKey` boundaries:
  - `dayStartLocal = "${dayKey}T00:00"` (or custom start hour)
  - `nextDayStartLocal = addDays(dayStartLocal, 1)`
  - Total minutes = difference(nextDayStartLocal, dayStartLocal) to handle 23/25-hour DST days.

## Layout Model
- Container: `relative` with height = `totalMinutes * pxPerMinute` (e.g., 1 min = 1 px, or 2 px for denser UI).
- Background grid: either:
  - `repeating-linear-gradient` for minor lines, + separate elements for hour lines and “now” line, or
  - render lines via a list to match left labels precisely.
- Event placement:
  - `top = (startMin - dayStartMin) * pxPerMinute`
  - `height = max(1, (endMin - startMin) * pxPerMinute)`; ensure minimum for very short spans.

### Overlap Algorithm (side-by-side columns)
A classic sweep-line algorithm yields columns for overlapping events:
1. Convert tasks to spans: `{ id, startMin, endMin }` (local minutes).
2. Sort by `startMin`, then by longer `endMin` first (minor).
3. Maintain `active` set ordered by `endMin`.
4. When a new event starts, assign it the smallest free column index not used by `active`.
5. Track `groupId` and `maxCols` per overlapping group (starts when `active` is empty, ends when becomes empty again).
6. For each event: `width = 100% / maxCols`, `left = colIndex * width`.

This produces Google Calendar–style side-by-side items that fill available width while overlapping.

Pseudocode:
```ts
function layout(events) {
  // events: [{ id, startMin, endMin }]
  const sorted = [...events].sort((a,b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const active: { id; endMin; col: number }[] = [];
  const freeCols: number[] = [];
  const results: Record<string, { col: number; group: number }> = {};
  let group = -1;

  for (const e of sorted) {
    // expire
    active.sort((a,b) => a.endMin - b.endMin);
    while (active.length && active[0].endMin <= e.startMin) {
      const out = active.shift()!;
      freeCols.push(out.col);
    }
    if (active.length === 0) {
      group += 1;
      freeCols.length = 0;
    }
    const col = freeCols.length ? freeCols.shift()! : active.length;
    active.push({ id: e.id, endMin: e.endMin, col });
    results[e.id] = { col, group };
  }

  // compute maxCols per group
  const groupCols: Record<number, number> = {};
  for (const { id } of sorted) {
    const { group, col } = results[id];
    groupCols[group] = Math.max(groupCols[group] ?? 0, col + 1);
  }

  return { results, groupCols };
}
```

In render, for item `i`:
- `cols = groupCols[results[i].group]`
- `left% = (results[i].col / cols) * 100`
- `width% = (1 / cols) * 100`

## Interactions
- Click empty grid to create:
  1. Get bounding rect of grid pane; compute `y = clientY - rect.top`.
  2. `minutesFromTop = y / pxPerMinute + dayStartMin`.
  3. Snap to `stepMin` (e.g., 15 or 30): `snapped = Math.round(minutes / stepMin) * stepMin`.
  4. `startLocal = dayKey + 'T' + HH:MM(snapped)`; `endLocal = startLocal + defaultDurationMin`.
  5. Convert to UTC via `toUTC`; call `onCreate(startUtcISO, endUtcISO)`.
  6. Parent opens `TaskSheet` with prefilled times.

- Optional v2: Drag-to-select to set custom duration:
  - `pointerdown` starts selection; `pointermove` updates ghost block; `pointerup` confirms.
  - Supports shift/alt to adjust snapping.

- Existing click on event calls `onSelect(task)` (unchanged behavior via `TaskSheet`).

## Rendering Details (Tailwind-oriented)
- Left rail width ~ `w-20` with monospaced hour labels.
- Grid pane `relative` with `select-none` to avoid accidental text selection.
- Event card `absolute` with `style={{ top, height, left: 'X%', width: 'Y%' }}`.
- Visuals:
  - Hour lines: `bg-border` solid.
  - Minor lines: lighter `bg-muted`.
  - “Now” line: `bg-red-500` thin line + small dot.
  - Event card styles follow existing `Card` and `Badge` tokens.

## Edge Cases
- All-day / no end time: render minimal-height chip at start; or special “All-day” row above grid (out of scope now).
- Due-only items: render as a small marker at due time in the grid (distinct color).
- DST days: compute `totalMinutes` from `dayKey` to next day in local TZ; grid height changes accordingly.
- Mobile: compress step to 30min; collapse left rail to fewer labels; enable pinch zoom later.

## Integration Points
- New component: `src/components/TimelineGrid.tsx` using API above.
- Update `src/app/(app)/core/CoreView.tsx` to use `TimelineGrid` instead of `Timeline` (feature-flagged optional at first):

```tsx
// CoreView.tsx (snippet)
<TimelineGrid
  tasks={timedMemo}
  tz={tz}
  dayKey={dayKey}
  stepMin={30}
  defaultDurationMin={30}
  onSelect={handleSelect}
  onCreate={(startUtc, endUtc) => {
    // Option 1: open TaskSheet prefilled
    setSelected({ id: '', title: '', startAt: startUtc, endAt: endUtc });
    setOpen(true);
    // Option 2: route to capture with params
    // const p = new URLSearchParams({ startAt: startUtc, endAt: endUtc });
    // router.push(`/core?${p.toString()}`);
  }}
/>
```

## Testing Strategy
- Unit tests (Vitest) for layout:
  - Non-overlapping, simple overlaps, nested overlaps, chains.
  - DST boundary day (23h/25h) grid minutes and positions.
- Interaction tests (RTL):
  - Click converts to snapped times; `onCreate` receives UTC ISO.
  - Existing event click triggers `onSelect`.
- Visual sanity via Storybook or simple routes (optional).

## Rollout Plan
1. Implement `TimelineGrid` alongside existing `Timeline`.
2. Add a toggle (env flag or URL query `?grid=1`) to switch renders.
3. Validate interactions and layout with seed data.
4. Replace `Timeline` in core default once stable.

## Open Questions
- Do we want side-by-side overlap (Calendar-like) or the current stacked-right style? Proposal defaults to side-by-side; we can offer a prop to switch.
- All-day row: should tasks without times be promoted here instead of `UntimedPane`?
- Default duration and snap step preferences — user-configurable?

---

This plan keeps logic isolated, testable, and compatible with existing timezone and sheet flows, while enabling a Calendar-like experience and click-to-create UX.
