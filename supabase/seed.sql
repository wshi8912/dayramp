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
  ('11111111-1111-1111-1111-111111111111', '12345678-1234-1234-1234-123456789012', 'voice', '買い物リスト: 牛乳, 卵, パン', 'https://example.com/audio/grocery.mp3', 'ja', now() - interval '2 days'),
  ('22222222-2222-2222-2222-222222222222', '12345678-1234-1234-1234-123456789012', 'text',  'Schedule weekly sync on Wednesday 3pm', null, 'en', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333333', '12345678-1234-1234-1234-123456789012', 'voice', '明日の午前にミーティング設定', 'https://example.com/audio/meeting.mp3', 'ja', now() - interval '6 hours'),
  ('44444444-4444-4444-4444-444444444444', '12345678-1234-1234-1234-123456789012', 'text',  'Plan weekend trip ideas', null, 'en', now() - interval '3 hours');



-- Tasks seed (separated from seed.sql)
-- Mix of: timed, deadline-only, untimed, various priorities/statuses, and links to entries
-- Time anchors (UTC):
--  - today_09  = date_trunc('day', now()) + 9h
--  - today_13  = date_trunc('day', now()) + 13h
--  - today_end = date_trunc('day', now()) + 23h 59m
--  - yest_16   = date_trunc('day', now() - interval '1 day') + 16h
--  - tomo_07   = date_trunc('day', now() + interval '1 day') + 7h
--  - next_10   = date_trunc('day', now() + interval '7 day') + 10h
--  - prev_11   = date_trunc('day', now() - interval '7 day') + 11h

-- Timed task today (manual)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Write project report',
  'Draft summary and next steps',
  date_trunc('day', now()) + interval '9 hour',
  date_trunc('day', now()) + interval '10 hour',
  60,
  'high',
  'todo',
  'manual',
  0.9
);

-- Timed task today (linked to JA voice entry e3)
insert into public.tasks (user_id, entry_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  '33333333-3333-3333-3333-333333333333',
  'クライアントミーティング',
  'Zoomリンクを確認',
  date_trunc('day', now()) + interval '13 hour 30 minute',
  date_trunc('day', now()) + interval '14 hour 30 minute',
  45,
  'mid',
  'todo',
  'voice',
  0.8
);

-- Deadline-only task today
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Pay utility bills',
  'Water and electricity',
  date_trunc('day', now()) + interval '23 hour 59 minute',
  20,
  'mid',
  'todo',
  'manual',
  0.7
);

-- Untimed task (created from EN text entry e2)
insert into public.tasks (user_id, entry_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  '22222222-2222-2222-2222-222222222222',
  'Set up weekly sync',
  'Add calendar invite for Wed 3pm',
  15,
  'low',
  'todo',
  'manual',
  0.6
);

-- Yesterday timed (done)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Fix bug #123',
  'Repro + add unit tests',
  date_trunc('day', now() - interval '1 day') + interval '16 hour',
  date_trunc('day', now() - interval '1 day') + interval '17 hour 30 minute',
  90,
  'high',
  'done',
  'manual',
  0.95
);

-- Tomorrow morning timed
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Workout',
  'Upper body + cardio',
  date_trunc('day', now() + interval '1 day') + interval '7 hour',
  date_trunc('day', now() + interval '1 day') + interval '8 hour',
  60,
  'mid',
  'todo',
  'manual',
  0.8
);

-- Tomorrow deadline-only
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Grocery shopping',
  'Fruits, veggies, snacks',
  date_trunc('day', now() + interval '1 day') + interval '18 hour',
  40,
  'low',
  'todo',
  'manual',
  0.7
);

-- Next week timed block
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Deep work: design doc',
  'Outline architecture v2',
  date_trunc('day', now() + interval '7 day') + interval '10 hour',
  date_trunc('day', now() + interval '7 day') + interval '12 hour 30 minute',
  150,
  'high',
  'todo',
  'manual',
  0.85
);

-- Last week untimed (deleted to test filtering)
insert into public.tasks (user_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Old task to ignore',
  'Should not appear in normal views',
  10,
  'low',
  'deleted',
  'manual',
  0.5
);

-- ---------------------------------------------------------------------------
-- Additional ~20 tasks for richer seed data
-- ---------------------------------------------------------------------------

-- Today: Team standup (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Team standup',
  'Daily sync',
  date_trunc('day', now()) + interval '9 hour 30 minute',
  date_trunc('day', now()) + interval '9 hour 45 minute',
  15,
  'mid',
  'todo',
  'manual',
  0.9
);

-- Today: Code review PR #456 (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Code review PR #456',
  'Focus on performance changes',
  date_trunc('day', now()) + interval '10 hour 15 minute',
  date_trunc('day', now()) + interval '10 hour 45 minute',
  30,
  'mid',
  'todo',
  'manual',
  0.8
);

-- Today: Lunch break (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Lunch break',
  'Step away from desk',
  date_trunc('day', now()) + interval '12 hour',
  date_trunc('day', now()) + interval '13 hour',
  60,
  'low',
  'todo',
  'manual',
  0.99
);

-- Today: Reply to client emails (due-only)
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Reply to client emails',
  'Prioritize ACME thread',
  date_trunc('day', now()) + interval '17 hour',
  25,
  'mid',
  'todo',
  'manual',
  0.7
);

-- Today: Prepare slides for update (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Prepare slides for quarterly update',
  'Add charts and key wins',
  date_trunc('day', now()) + interval '15 hour',
  date_trunc('day', now()) + interval '16 hour 30 minute',
  90,
  'high',
  'todo',
  'manual',
  0.85
);

-- Today: Clean up inbox (untimed)
insert into public.tasks (user_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Clean up inbox',
  'Archive/label old threads',
  20,
  'low',
  'todo',
  'manual',
  0.5
);

-- Untimed: Refactor auth module
insert into public.tasks (user_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Refactor auth module',
  'Split providers and guards',
  120,
  'high',
  'todo',
  'manual',
  0.6
);

-- Untimed: Write unit tests for tasks API
insert into public.tasks (user_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Write unit tests for tasks API',
  'Cover CRUD + ranges',
  80,
  'mid',
  'todo',
  'manual',
  0.7
);

-- Tomorrow: Plan sprint backlog (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Plan sprint backlog',
  'Prioritize tickets',
  date_trunc('day', now() + interval '1 day') + interval '9 hour',
  date_trunc('day', now() + interval '1 day') + interval '10 hour 30 minute',
  90,
  'high',
  'todo',
  'manual',
  0.8
);

-- Tomorrow: Call with supplier (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Call with supplier',
  'Confirm delivery timeline',
  date_trunc('day', now() + interval '1 day') + interval '11 hour',
  date_trunc('day', now() + interval '1 day') + interval '11 hour 30 minute',
  30,
  'mid',
  'todo',
  'manual',
  0.7
);

-- Tomorrow: Review analytics (due-only)
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Review analytics',
  'Weekly report',
  date_trunc('day', now() + interval '1 day') + interval '16 hour',
  35,
  'mid',
  'todo',
  'manual',
  0.6
);

-- Untimed (linked to JA voice entry e1): 献立を作成
insert into public.tasks (user_id, entry_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  '11111111-1111-1111-1111-111111111111',
  '献立を作成（買い物リストから）',
  '1週間分のプラン',
  45,
  'mid',
  'todo',
  'voice',
  0.7
);

-- Untimed (linked to JA voice entry e3): 議事録作成
insert into public.tasks (user_id, entry_id, title, note, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  '33333333-3333-3333-3333-333333333333',
  '議事録作成（クライアントミーティング）',
  '要点をまとめる',
  40,
  'mid',
  'todo',
  'voice',
  0.6
);

-- +3 days: 週末旅行のアイデア調査 (timed, linked to text entry e4)
insert into public.tasks (user_id, entry_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  '44444444-4444-4444-4444-444444444444',
  '週末旅行のアイデア調査',
  '温泉/自然スポット',
  date_trunc('day', now() + interval '3 day') + interval '20 hour',
  date_trunc('day', now() + interval '3 day') + interval '21 hour 30 minute',
  90,
  'mid',
  'todo',
  'manual',
  0.7
);

-- +2 days: Backup database (due-only)
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Backup database',
  'Nightly full backup',
  date_trunc('day', now() + interval '2 day') + interval '23 hour',
  30,
  'low',
  'todo',
  'manual',
  0.6
);

-- +3 days: Prototype mobile UI (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Prototype mobile UI',
  'Home + Task views',
  date_trunc('day', now() + interval '3 day') + interval '14 hour',
  date_trunc('day', now() + interval '3 day') + interval '16 hour',
  120,
  'high',
  'todo',
  'manual',
  0.7
);

-- +4 days: Doctor appointment (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Doctor appointment',
  'Annual checkup',
  date_trunc('day', now() + interval '4 day') + interval '9 hour',
  date_trunc('day', now() + interval '4 day') + interval '9 hour 30 minute',
  30,
  'mid',
  'todo',
  'manual',
  0.9
);

-- +5 days: Renew domain (due-only)
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Renew domain',
  'example.com',
  date_trunc('day', now() + interval '5 day') + interval '12 hour',
  10,
  'low',
  'todo',
  'manual',
  0.8
);

-- +6 days: Family dinner (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Family dinner',
  'At parents'' place',
  date_trunc('day', now() + interval '6 day') + interval '19 hour',
  date_trunc('day', now() + interval '6 day') + interval '21 hour',
  120,
  'low',
  'todo',
  'manual',
  0.9
);

-- -2 days: Clean workspace (done, timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Clean workspace',
  'Tidy desk and shelves',
  date_trunc('day', now() - interval '2 day') + interval '17 hour',
  date_trunc('day', now() - interval '2 day') + interval '17 hour 30 minute',
  30,
  'low',
  'done',
  'manual',
  0.9
);

-- -3 days: Write blog post (done, due-only)
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Write blog post',
  'Seed data best practices',
  date_trunc('day', now() - interval '3 day') + interval '20 hour',
  60,
  'mid',
  'done',
  'manual',
  0.7
);

-- +8 days: Follow up with recruiter (due-only)
insert into public.tasks (user_id, title, note, due_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Follow up with recruiter',
  'Schedule a chat',
  date_trunc('day', now() + interval '8 day') + interval '10 hour',
  10,
  'mid',
  'todo',
  'manual',
  0.6
);

-- +8 days: Quarterly budget review (timed)
insert into public.tasks (user_id, title, note, start_at, end_at, estimate_min, priority, status, source, confidence)
values (
  '12345678-1234-1234-1234-123456789012',
  'Quarterly budget review',
  'Prepare next quarter forecasts',
  date_trunc('day', now() + interval '8 day') + interval '9 hour',
  date_trunc('day', now() + interval '8 day') + interval '11 hour',
  120,
  'high',
  'todo',
  'manual',
  0.8
);



-- Notify successful completion
SELECT 'Successfully created test user' as result;
SELECT 'Login credentials: test@example.com / password123' as credentials;
