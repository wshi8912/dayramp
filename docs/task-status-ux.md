# Task Status UX Strategy

## Objectives
- Make `todo`, `pending`, and `done` states obvious at a glance in both calendar and lists.
- Allow status changes with minimal friction from the two primary entry points: calendar cards and the TODO pane.
- Keep the mental model consistent: left side interactions are for events (pending-oriented), right side for tasks (todo/deadline oriented).
- Provide lightweight summaries of what remains vs. what is blocked or completed, without overwhelming the layout.

## Current Snapshot
- Status changes happen through the `TaskStatusBadge` dropdown embedded inside cards. It is functional but visually subtle and hidden behind a click.
- Status colors are subtle on calendar cards, making it harder to differentiate pending vs. done once the chip blends with the card tone.
- TODO pane intermixes all states and relies on badge text; no quick filters or grouping.
- Completed work remains visible, requiring manual mental filtering when reviewing the day.

## Design Principles
1. **Proximity-based clarity** – show the current status near the task title in every view.
2. **One-click transition** – most common status transitions (`todo → pending`, `pending → done`, `done → todo`) should be possible with a tap or swipe.
3. **Contextual visibility** – default view prioritises actionable items; optional affordances surface pending blockers and finished work.
4. **Progress signaling** – use consistent color + icon pairing across calendar, list, and popovers.
5. **Keyboard-friendly** – support quick cycling via keyboard for power users (focus + hotkeys).

## Interaction Model

### Status Pill Upgrade
- Convert the current dropdown badge into a segmented pill:
  - Default collapsed state shows the current status (icon + label).
  - Hover / focus reveals a mini segmented control for the other two states.
  - Reminder: keep pill size consistent with calendar card typography.
- Supplement with keyboard shortcuts:
  - `⌘⇧P` (or `Ctrl+Shift+P`) toggles `todo ↔ pending`.
  - `⌘⇧D` toggles `pending ↔ done` when the card is focused.

### Calendar Cards
- Overlay a slim status ribbon on the top edge:
  - Accent colors: sky (todo), amber (pending), emerald (done).
  - Include a small icon (circle, clock, check).
- Clicking the ribbon cycles to the next status; right-click / long press opens full menu.
- Dim completed (`done`) cards to 60% opacity, but keep text legible; optionally collapse them into a “Completed (N)” drawer at the bottom of the day to avoid clutter.

### TODO Pane
- Introduce tabbed filters or segmented control at the top: `Action Items (todo)`, `Waiting (pending)`, `Completed`.
- Default view: `Action Items`, with a small summary chip indicating counts for the other states.
- Pending tasks display a helper chip explaining the blocked state (e.g., “Waiting on X”), with CTA to add a note.
- Completed tasks are tucked into a collapsible section with timestamp badges (“Done at 16:45”) for quick review.

### Bulk & Quick Actions
- Multi-select mode (checkboxes aligned with left edge) for batch status updates and archiving.
- Drag-and-drop from `todo`/`pending` into a “Done” drop zone to mark completion.
- Floating action chip in the timeline might offer “Mark next N tasks as done” when a user finishes a block session.

## Visual Language
- Respect the updated pastel calendar tones; use deeper borders for status indications.
- Status icons:
  - `todo`: `Circle` stroked icon.
  - `pending`: `Clock` filled outline.
  - `done`: `Check` solid background.
- Tooltip guidelines: show the intended transition (“Mark as done”) on hover.
- Motion: subtle fade + scale when a status changes to reinforce feedback.

## Implementation Phases

### Phase 1 – Low-effort Wins
- Update `TaskStatusBadge` to segmented pill, unify icon usage, expose keyboard shortcuts.
- Add status ribbon overlays on calendar cards.
- Collapse completed tasks in TODO pane behind a toggle.

### Phase 2 – Interaction Enhancements
- Implement top-level filters / tabs for TODO pane.
- Add inline notes for pending status (small input or quick action to capture blockers).
- Introduce keyboard navigation (focus ring, shortcut handlers).

### Phase 3 – Advanced UX
- Multi-select with batch status updates.
- Drag-to-complete interactions in TODO list and calendar.
- Analytics-friendly metrics (e.g., “3 tasks moved to done today”) using subtle toasts.

## Open Questions
- Do users need a dedicated “Blocked” state, or can `pending` cover both waiting and in-progress cases?
- Should completed events persist in the calendar view, or auto-collapse after a configurable window?
- Are there audit requirements (e.g., log of status transitions) that influence UI feedback?

Answering these will help finalise micro-interactions and data tracking requirements.
