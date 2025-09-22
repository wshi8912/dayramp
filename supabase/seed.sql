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

-- Notify successful completion
SELECT 'Successfully created test user' as result;
SELECT 'Login credentials: test@example.com / password123' as credentials;
