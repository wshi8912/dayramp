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
