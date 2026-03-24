-- =============================================================
-- 003_fix_auth_seed.sql
-- Clears broken auth rows from migration 002 and re-inserts them
-- in the format GoTrue expects.
--
-- Root cause: crypt()/gen_salt() live in the `extensions` schema
-- on Supabase Cloud, so bare names fail when called from a migration
-- context where extensions schema is not in search_path.
-- Fix: use extensions.crypt() / extensions.gen_salt() throughout.
-- =============================================================

-- Ensure pgcrypto is available (idempotent).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Remove any broken / orphaned identity rows for the seed emails ─────────
DELETE FROM auth.identities
WHERE provider_id IN (
  'thabo@example.com','sipho@example.com','david@example.com',
  'naledi@example.com','lerato@example.com','grace@example.com','tshepiso@example.com'
);

-- ── 2. Remove any broken auth.users rows for the seed emails ──────────────────
DELETE FROM auth.users
WHERE email IN (
  'thabo@example.com','sipho@example.com','david@example.com',
  'naledi@example.com','lerato@example.com','grace@example.com','tshepiso@example.com'
);

-- ── 3. Remove stray test rows created during debugging ────────────────────────
DELETE FROM auth.users
WHERE email IN ('test_id@example.com','thabo_test@example.com');

-- ── 4. Re-insert auth.users with ALL required columns ────────────────────────
--    Use extensions.crypt / extensions.gen_salt to avoid search_path issues.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous,
  created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','thabo@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now()),

  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sipho@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now()),

  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','david@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now()),

  ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','naledi@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now()),

  ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lerato@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now()),

  ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','grace@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now()),

  ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tshepiso@example.com',
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    now(),'','','','',
    '{"provider":"email","providers":["email"]}','{}',
    false, false, false, now(), now())

ON CONFLICT (id) DO UPDATE SET
  encrypted_password  = EXCLUDED.encrypted_password,
  email_confirmed_at  = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
  updated_at          = now();

-- ── 5. Insert identities using GoTrue's expected format ───────────────────────
--    Derive one identity per user from auth.users so we don't hardcode
--    the identity row UUID — GoTrue auto-generates it on its own inserts.
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
SELECT
  u.email,
  u.id,
  jsonb_build_object(
    'sub',            u.id::text,
    'email',          u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now()
FROM auth.users u
WHERE u.email IN (
  'thabo@example.com','sipho@example.com','david@example.com',
  'naledi@example.com','lerato@example.com','grace@example.com','tshepiso@example.com'
)
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at    = now();
