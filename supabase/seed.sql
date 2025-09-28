-- GENERATED FILE. Do not edit directly.
-- Run `npm run seed:build` to regenerate from supabase/seeds/*.sql

-- Supabase Seed Data for DayRamp Development
-- This file is automatically run when using `supabase db reset`

-- Create test user for development
-- Email: test@example.com
-- Password: password123

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  email_change_sent_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '12345678-1234-1234-1234-123456789012',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  '',
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  FALSE,
  NULL,
  FALSE
);

-- Insert identity for the test user  
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '12345678-1234-1234-1234-123456789012',
  '12345678-1234-1234-1234-123456789012',
  '{"sub": "12345678-1234-1234-1234-123456789012", "email": "test@example.com", "email_verified": true, "phone_verified": false}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Ensure public.users profile has friendly values for debugging (timezone, name)
update public.users
  set full_name = coalesce(full_name, 'Test User'),
      avatar_url = coalesce(avatar_url, 'https://avatars.githubusercontent.com/u/1?v=4'),
      timezone = 'Asia/Tokyo'
where id = '12345678-1234-1234-1234-123456789012';


-- ---------------------------------------------------------------------------
-- Seed: entries and tasks (inlined by build-seed.js)
-- ---------------------------------------------------------------------------

-- Entries seed (separated from seed.sql)
-- Fixed UUIDs for entries so tasks can reference them reliably
-- e1 (voice, JA), e2 (text, EN), e3 (voice, JA), e4 (text, EN)
-- Note: timestamps use now() with +/- intervals so seeded data is near "today".

insert into public.entries (id, user_id, source, transcript, audio_url, lang, created_at)
values
  ('11111111-1111-1111-1111-111111111111', '12345678-1234-1234-1234-123456789012', 'voice', 'Grocery list: milk, eggs, bread', 'https://example.com/audio/grocery.mp3', 'en', now() - interval '2 days'),
  ('22222222-2222-2222-2222-222222222222', '12345678-1234-1234-1234-123456789012', 'text',  'Schedule weekly sync on Wednesday 3pm', null, 'en', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333333', '12345678-1234-1234-1234-123456789012', 'voice', 'Schedule a meeting tomorrow morning', 'https://example.com/audio/meeting.mp3', 'en', now() - interval '6 hours'),
  ('44444444-4444-4444-4444-444444444444', '12345678-1234-1234-1234-123456789012', 'text',  'Plan weekend trip ideas', null, 'en', now() - interval '3 hours');



-- Tasks seed (separated from seed.sql)
-- Covers task vs event semantics with combinations of timeboxes, deadlines, start-only anchors,
-- and standalone events. Time anchors (UTC):
--  - today_*  = date_trunc('day', now()) + offset
--  - yest_*   = date_trunc('day', now() - interval '1 day') + offset
--  - tomo_*   = date_trunc('day', now() + interval '1 day') + offset
--  - next_*   = date_trunc('day', now() + interval 'n day') + offset
--
-- All inserts explicitly set the new `kind` column to highlight whether a row is a task or event.

-- ---------------------------------------------------------------------------
-- Tasks (kind = 'task')
-- ---------------------------------------------------------------------------

-- Timeboxed task today (manual)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Write project report',
  'Draft summary and next steps',
  date_trunc('day', now()) + interval '9 hour',
  date_trunc('day', now()) + interval '10 hour',
  null,
  60,
  'high',
  'todo',
  'manual',
  0.9,
  'task'
);

-- Timeboxed task from voice entry (yesterday) already done
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  '33333333-3333-3333-3333-333333333333',
  'Fix bug #123',
  'Repro and add regression tests',
  date_trunc('day', now() - interval '1 day') + interval '16 hour',
  date_trunc('day', now() - interval '1 day') + interval '17 hour 30 minute',
  null,
  90,
  'high',
  'done',
  'manual',
  0.95,
  'task'
);

-- Timeboxed task later today (manual)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Prepare slides for quarterly update',
  'Add charts and key wins',
  date_trunc('day', now()) + interval '15 hour',
  date_trunc('day', now()) + interval '16 hour 30 minute',
  null,
  90,
  'high',
  'todo',
  'manual',
  0.85,
  'task'
);

-- Timeboxed task this morning (manual)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Code review PR #456',
  'Focus on performance changes',
  date_trunc('day', now()) + interval '10 hour 15 minute',
  date_trunc('day', now()) + interval '10 hour 45 minute',
  null,
  30,
  'mid',
  'todo',
  'manual',
  0.8,
  'task'
);

-- Timeboxed task tomorrow (manual)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Plan sprint backlog',
  'Prioritize tickets for the next iteration',
  date_trunc('day', now() + interval '1 day') + interval '9 hour',
  date_trunc('day', now() + interval '1 day') + interval '10 hour 30 minute',
  null,
  90,
  'high',
  'todo',
  'manual',
  0.82,
  'task'
);

-- Timeboxed task next week (manual)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Deep work: design doc',
  'Outline architecture v2',
  date_trunc('day', now() + interval '7 day') + interval '10 hour',
  date_trunc('day', now() + interval '7 day') + interval '12 hour 30 minute',
  null,
  150,
  'high',
  'todo',
  'manual',
  0.88,
  'task'
);

-- Timeboxed weekend task (manual)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  '44444444-4444-4444-4444-444444444444',
  'Prototype mobile UI',
  'Home + task views',
  date_trunc('day', now() + interval '3 day') + interval '14 hour',
  date_trunc('day', now() + interval '3 day') + interval '16 hour',
  null,
  120,
  'high',
  'todo',
  'manual',
  0.7,
  'task'
);

-- Start-only task (acts as earliest start reminder)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Begin testing migration script',
  'Kick off smoke tests after lunch',
  date_trunc('day', now()) + interval '13 hour 30 minute',
  null,
  null,
  45,
  'mid',
  'todo',
  'manual',
  0.75,
  'task'
);

-- Future start-only task
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Start quarterly planning notes',
  'Outline agenda once calendar is clear',
  date_trunc('day', now() + interval '2 day') + interval '8 hour 30 minute',
  null,
  null,
  30,
  'mid',
  'todo',
  'manual',
  0.6,
  'task'
);

-- Deadline-driven task today
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Pay utility bills',
  'Water and electricity',
  null,
  null,
  date_trunc('day', now()) + interval '23 hour 59 minute',
  20,
  'mid',
  'todo',
  'manual',
  0.7,
  'task'
);

-- Deadline-driven task today (late afternoon)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Reply to client emails',
  'Prioritize ACME thread',
  null,
  null,
  date_trunc('day', now()) + interval '17 hour',
  25,
  'mid',
  'todo',
  'manual',
  0.7,
  'task'
);

-- Deadline-driven task tomorrow
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Review analytics',
  'Weekly metrics snapshot',
  null,
  null,
  date_trunc('day', now() + interval '1 day') + interval '16 hour',
  35,
  'mid',
  'todo',
  'manual',
  0.6,
  'task'
);

-- Deadline-driven task tomorrow evening
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Grocery shopping',
  'Fruits, veggies, snacks',
  null,
  null,
  date_trunc('day', now() + interval '1 day') + interval '18 hour',
  40,
  'low',
  'todo',
  'manual',
  0.7,
  'task'
);

-- Future deadline-only tasks
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values
  (
    '12345678-1234-1234-1234-123456789012',
    null,
    'Backup database',
    'Nightly full backup',
    null,
    null,
    date_trunc('day', now() + interval '2 day') + interval '23 hour',
    30,
    'low',
    'todo',
    'manual',
    0.6,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    null,
    'Renew domain',
    'example.com renewal',
    null,
    null,
    date_trunc('day', now() + interval '5 day') + interval '12 hour',
    10,
    'low',
    'todo',
    'manual',
    0.8,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    null,
    'Follow up with recruiter',
    'Schedule a chat',
    null,
    null,
    date_trunc('day', now() + interval '8 day') + interval '10 hour',
    10,
    'mid',
    'todo',
    'manual',
    0.6,
    'task'
  );

-- Untimed backlog tasks
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values
  (
    '12345678-1234-1234-1234-123456789012',
    '22222222-2222-2222-2222-222222222222',
    'Set up weekly sync',
    'Add calendar invite for Wed 3pm',
    null,
    null,
    null,
    15,
    'low',
    'todo',
    'manual',
    0.6,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    null,
    'Clean up inbox',
    'Archive/label old threads',
    null,
    null,
    null,
    20,
    'low',
    'todo',
    'manual',
    0.5,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    null,
    'Refactor auth module',
    'Split providers and guards',
    null,
    null,
    null,
    120,
    'high',
    'todo',
    'manual',
    0.6,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    null,
    'Write unit tests for tasks API',
    'Cover CRUD + ranges',
    null,
    null,
    null,
    80,
    'mid',
    'todo',
    'manual',
    0.7,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    '11111111-1111-1111-1111-111111111111',
    'Create meal plan (from grocery list)',
    '1-week plan',
    null,
    null,
    null,
    45,
    'mid',
    'todo',
    'voice',
    0.7,
    'task'
  ),
  (
    '12345678-1234-1234-1234-123456789012',
    '33333333-3333-3333-3333-333333333333',
    'Create meeting minutes (client meeting)',
    'Summarize key points',
    null,
    null,
    null,
    40,
    'mid',
    'todo',
    'voice',
    0.6,
    'task'
  );

-- Completed backlog item (due-only)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Write blog post',
  'Seed data best practices',
  null,
  null,
  date_trunc('day', now() - interval '3 day') + interval '20 hour',
  60,
  'mid',
  'done',
  'manual',
  0.7,
  'task'
);

-- Deleted task for filtering tests
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Old task to ignore',
  'Should not appear in normal views',
  null,
  null,
  null,
  10,
  'low',
  'deleted',
  'manual',
  0.5,
  'task'
);

-- ---------------------------------------------------------------------------
-- Events (kind = 'event')
-- ---------------------------------------------------------------------------

-- Daily team standup (today)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Team standup',
  'Daily sync with engineering',
  date_trunc('day', now()) + interval '9 hour 30 minute',
  date_trunc('day', now()) + interval '9 hour 45 minute',
  null,
  15,
  'mid',
  'pending',
  'manual',
  0.9,
  'event'
);

-- Client meeting captured from voice entry (today)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  '33333333-3333-3333-3333-333333333333',
  'Client meeting',
  'Confirm sprint deliverables',
  date_trunc('day', now()) + interval '13 hour 30 minute',
  date_trunc('day', now()) + interval '14 hour 30 minute',
  null,
  60,
  'mid',
  'pending',
  'voice',
  0.8,
  'event'
);

-- Lunch break (today)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Lunch break',
  'Step away from desk',
  date_trunc('day', now()) + interval '12 hour',
  date_trunc('day', now()) + interval '13 hour',
  null,
  60,
  'low',
  'pending',
  'manual',
  0.99,
  'event'
);

-- Call with supplier (tomorrow)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Call with supplier',
  'Confirm delivery timeline',
  date_trunc('day', now() + interval '1 day') + interval '11 hour',
  date_trunc('day', now() + interval '1 day') + interval '11 hour 30 minute',
  null,
  30,
  'mid',
  'pending',
  'manual',
  0.7,
  'event'
);

-- Webinar later this week
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Webinar: Product launch',
  'Attend partner showcase',
  date_trunc('day', now() + interval '2 day') + interval '18 hour',
  date_trunc('day', now() + interval '2 day') + interval '19 hour 30 minute',
  null,
  90,
  'mid',
  'pending',
  'manual',
  0.65,
  'event'
);

-- Doctor appointment (next week)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Doctor appointment',
  'Annual checkup',
  date_trunc('day', now() + interval '4 day') + interval '9 hour',
  date_trunc('day', now() + interval '4 day') + interval '9 hour 30 minute',
  null,
  30,
  'mid',
  'pending',
  'manual',
  0.9,
  'event'
);

-- Family dinner (weekend personal event)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Family dinner',
  'At parents'' place',
  date_trunc('day', now() + interval '6 day') + interval '19 hour',
  date_trunc('day', now() + interval '6 day') + interval '21 hour',
  null,
  120,
  'low',
  'pending',
  'manual',
  0.9,
  'event'
);

-- Past event marked done
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Quarterly roadmap review',
  'With leadership team',
  date_trunc('day', now() - interval '1 day') + interval '16 hour',
  date_trunc('day', now() - interval '1 day') + interval '17 hour',
  null,
  60,
  'high',
  'done',
  'manual',
  0.85,
  'event'
);

-- Personal training session (future pending event)
insert into public.tasks (
  user_id, entry_id, title, note, start_at, end_at, due_at,
  estimate_min, priority, status, source, confidence, kind
) values (
  '12345678-1234-1234-1234-123456789012',
  null,
  'Personal training session',
  'Focus on mobility',
  date_trunc('day', now() + interval '9 day') + interval '7 hour 30 minute',
  date_trunc('day', now() + interval '9 day') + interval '8 hour 30 minute',
  null,
  60,
  'mid',
  'pending',
  'manual',
  0.7,
  'event'
);



-- Notify successful completion
SELECT 'Successfully created test user' as result;
SELECT 'Login credentials: test@example.com / password123' as credentials;
