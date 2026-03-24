-- =============================================================
-- 002_seed_data.sql
-- Sea of Glass Rustenburg - Development Seed Data
-- WARNING: Contains test credentials. Use only in development.
-- =============================================================

-- Fixed UUIDs (must match auth.users.id for RLS to work):
--   Members  m1–m12 : 00000000-0000-0000-0000-00000000000N
--   Ministries min1–24: 00000000-0000-0000-0001-00000000000N

-- =============================================================
-- AUTH USERS  (development only — mirrors loginCredentials)
-- =============================================================
-- Insert test Supabase Auth users whose id matches the member UUID below.
-- The pgcrypto extension (already enabled in migration 001) is required.
-- In production, users register normally through Supabase Auth.

-- bcrypt cost MUST be >= 10 for Supabase GoTrue to accept the hash.
-- gen_salt('bf') defaults to cost 6 which GoTrue rejects as "invalid password".
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','thabo@example.com',   crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now()),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sipho@example.com',    crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now()),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','david@example.com',    crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now()),
  ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','naledi@example.com',   crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now()),
  ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lerato@example.com',   crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now()),
  ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','grace@example.com',    crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now()),
  ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tshepiso@example.com', crypt('admin123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}','{}', now(), now())
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
  updated_at         = now();

-- identity_data MUST include "email_verified":true — newer GoTrue versions
-- check this field and reject logins where it is absent or false.
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000001','thabo@example.com',    '00000000-0000-0000-0000-000000000001','{"sub":"00000000-0000-0000-0000-000000000001","email":"thabo@example.com","email_verified":true}',   'email', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002','sipho@example.com',    '00000000-0000-0000-0000-000000000002','{"sub":"00000000-0000-0000-0000-000000000002","email":"sipho@example.com","email_verified":true}',    'email', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003','david@example.com',    '00000000-0000-0000-0000-000000000003','{"sub":"00000000-0000-0000-0000-000000000003","email":"david@example.com","email_verified":true}',    'email', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000005','naledi@example.com',   '00000000-0000-0000-0000-000000000005','{"sub":"00000000-0000-0000-0000-000000000005","email":"naledi@example.com","email_verified":true}',   'email', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000006','lerato@example.com',   '00000000-0000-0000-0000-000000000006','{"sub":"00000000-0000-0000-0000-000000000006","email":"lerato@example.com","email_verified":true}',   'email', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000008','grace@example.com',    '00000000-0000-0000-0000-000000000008','{"sub":"00000000-0000-0000-0000-000000000008","email":"grace@example.com","email_verified":true}',    'email', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000009','tshepiso@example.com', '00000000-0000-0000-0000-000000000009','{"sub":"00000000-0000-0000-0000-000000000009","email":"tshepiso@example.com","email_verified":true}', 'email', now(), now(), now())
ON CONFLICT (id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at    = now();

-- =============================================================
-- MEMBERS
-- =============================================================

INSERT INTO members (id, name, scj_number, email, phone, telegram_handle, department, cell, duty_title, ga_status, is_pastor, status, profile_image_url, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Thabo Molefe',         'SCJ-RSA-001', 'thabo@example.com',     '+27711234567', '@thabo_m',      'MG',  'MG-A',  'GSN',    'Evangelist', false, 'Active',  null, '2023-01-15'),
  ('00000000-0000-0000-0000-000000000002', 'Sipho Ndlovu',         'SCJ-RSA-002', 'sipho@example.com',     '+27712345678', '@sipho_n',      'MG',  'MG-A',  'SMN',    'Instructor', false, 'Active',  null, '2023-02-10'),
  ('00000000-0000-0000-0000-000000000003', 'David Khumalo',        'SCJ-RSA-003', 'david@example.com',     '+27713456789', '@david_k',      'MG',  'MG-B',  'HJN',    'Deacon',     false, 'Active',  null, '2023-03-05'),
  ('00000000-0000-0000-0000-000000000004', 'John Mokoena',         'SCJ-RSA-004', 'john@example.com',      '+27714567890', '@john_m',       'MG',  'MG-B',  'GYJN',   'Member',     true,  'Active',  null, '2023-03-20'),
  ('00000000-0000-0000-0000-000000000005', 'Naledi Dlamini',       'SCJ-RSA-005', 'naledi@example.com',    '+27715678901', '@naledi_d',     'WG',  'WG-A',  'HJN',    'Instructor', false, 'Active',  null, '2023-04-01'),
  ('00000000-0000-0000-0000-000000000006', 'Lerato Mahlangu',      'SCJ-RSA-006', 'lerato@example.com',    '+27716789012', '@lerato_m',     'WG',  'WG-A',  'GYJN',   'Member',     false, 'Active',  null, '2023-04-15'),
  ('00000000-0000-0000-0000-000000000007', 'Palesa Motaung',       'SCJ-RSA-007', 'palesa@example.com',    '+27717890123', '@palesa_m',     'WG',  'WG-B',  'SGN',    'Deacon',     false, 'Active',  null, '2023-05-01'),
  ('00000000-0000-0000-0000-000000000008', 'Grace Nkosi',          'SCJ-RSA-008', 'grace@example.com',     '+27718901234', '@grace_n',      'WG',  'WG-B',  'MEMBER', 'Member',     false, 'Absentee',null, '2023-05-15'),
  ('00000000-0000-0000-0000-000000000009', 'Tshepiso Tshabalala',  'SCJ-RSA-009', 'tshepiso@example.com',  '+27719012345', '@tshepiso_t',   'YG',  'YG-A',  'HJN',    'Member',     false, 'Active',  null, '2023-06-01'),
  ('00000000-0000-0000-0000-000000000010', 'Mpho Setlhare',        'SCJ-RSA-010', 'mpho@example.com',      '+27710123456', '@mpho_s',       'YG',  'YG-B',  'GYJN',   'Member',     false, 'Active',  null, '2023-06-15'),
  ('00000000-0000-0000-0000-000000000011', 'Elizabeth Phiri',      'SCJ-RSA-011', 'elizabeth@example.com', '+27711122334', '@liz_p',        'SNG', 'SNG-A', 'HJN',    'Evangelist', false, 'Active',  null, '2023-07-01'),
  ('00000000-0000-0000-0000-000000000012', 'Samuel Mthembu',       'SCJ-RSA-012', 'samuel@example.com',    '+27712233445', '@sam_m',        'SNG', 'SNG-B', 'MEMBER', 'Member',     false, 'Exempted',null, '2023-07-15');

-- =============================================================
-- MINISTRIES  (bjn_member_id references members above)
-- =============================================================

INSERT INTO ministries (id, name, abbreviation, is_active, bjn_member_id) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Planning',                    'PLAN', true,  '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0001-000000000002', 'Finance',                     'FIN',  true,  '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0001-000000000003', 'Education',                   'EDU',  true,  '00000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0001-000000000004', 'Theology',                    'THEO', true,  '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0001-000000000005', 'Evangelism',                  'EVAN', true,  '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0001-000000000006', 'Culture',                     'CULT', true,  '00000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0001-000000000007', 'Domestic Missions (MODM)',    'MODM', true,  '00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0001-000000000008', 'Construction',                'CONST',true,  null),
  ('00000000-0000-0000-0001-000000000009', 'Admin & General Affairs',     'AGA',  false, null),
  ('00000000-0000-0000-0001-000000000010', 'Internal Affairs',            'IA',   false, null),
  ('00000000-0000-0000-0001-000000000011', 'International Missions',      'IM',   false, null),
  ('00000000-0000-0000-0001-000000000012', 'International Dept',          'ID',   false, null),
  ('00000000-0000-0000-0001-000000000013', 'ICT',                         'ICT',  false, null),
  ('00000000-0000-0000-0001-000000000014', 'Praise & Worship',            'PW',   false, null),
  ('00000000-0000-0000-0001-000000000015', 'Liaison',                     'LIA',  false, null),
  ('00000000-0000-0000-0001-000000000016', 'Publicity',                   'PUB',  false, null),
  ('00000000-0000-0000-0001-000000000017', 'Judicial Affairs',            'JUD',  false, null),
  ('00000000-0000-0000-0001-000000000018', 'Auditing',                    'AUD',  false, null),
  ('00000000-0000-0000-0001-000000000019', 'Sports',                      'SPT',  false, null),
  ('00000000-0000-0000-0001-000000000020', 'Enterprise',                  'ENT',  false, null),
  ('00000000-0000-0000-0001-000000000021', 'Health & Welfare',            'HW',   false, null),
  ('00000000-0000-0000-0001-000000000022', 'Service & Transportation',    'ST',   false, null),
  ('00000000-0000-0000-0001-000000000023', 'Diplomatic Policy',           'DP',   false, null),
  ('00000000-0000-0000-0001-000000000024', 'Publishing',                  'PUBL', false, null);

-- =============================================================
-- MEMBER_DUTY_HISTORY
-- Disable the auto-close trigger during seed to avoid side effects.
-- =============================================================

ALTER TABLE member_duty_history DISABLE TRIGGER tr_close_previous_duty_history;

INSERT INTO member_duty_history (id, member_id, role, department, cell, ministry_id, appointed_date, ended_date, appointed_by, approved_by, reason_for_change, created_at) VALUES
  -- Thabo (m1): GSN since founding, still active
  ('00000000-0000-0000-0002-000000000001',
   '00000000-0000-0000-0000-000000000001', 'GSN', 'MG', 'MG-A', null,
   '2023-01-15', null,
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Church establishment', '2023-01-15'),

  -- Sipho (m2): SMN since founding, still active
  ('00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0000-000000000002', 'SMN', 'MG', 'MG-A', null,
   '2023-02-10', null,
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Appointed as secretary', '2023-02-10'),

  -- David (m3): initially MEMBER, then promoted to HJN
  ('00000000-0000-0000-0002-000000000003',
   '00000000-0000-0000-0000-000000000003', 'MEMBER', 'MG', 'MG-B', null,
   '2023-03-05', '2023-08-01',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Initial joining', '2023-03-05'),

  ('00000000-0000-0000-0002-000000000004',
   '00000000-0000-0000-0000-000000000003', 'HJN', 'MG', 'MG-B',
   '00000000-0000-0000-0001-000000000001',
   '2023-08-01', null,
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Promoted to department leader', '2023-08-01');

ALTER TABLE member_duty_history ENABLE TRIGGER tr_close_previous_duty_history;

-- =============================================================
-- USER_ROLES  (one row per member, mirrors current duty_title)
-- =============================================================

INSERT INTO user_roles (member_id, role, department, cell, ministry_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'GSN',    'MG',  'MG-A',  null),
  ('00000000-0000-0000-0000-000000000002', 'SMN',    'MG',  'MG-A',  null),
  ('00000000-0000-0000-0000-000000000003', 'HJN',    'MG',  'MG-B',  '00000000-0000-0000-0001-000000000001'),
  ('00000000-0000-0000-0000-000000000004', 'GYJN',   'MG',  'MG-B',  null),
  ('00000000-0000-0000-0000-000000000005', 'HJN',    'WG',  'WG-A',  '00000000-0000-0000-0001-000000000002'),
  ('00000000-0000-0000-0000-000000000006', 'GYJN',   'WG',  'WG-A',  '00000000-0000-0000-0001-000000000007'),
  ('00000000-0000-0000-0000-000000000007', 'SGN',    'WG',  'WG-B',  '00000000-0000-0000-0001-000000000006'),
  ('00000000-0000-0000-0000-000000000008', 'MEMBER', 'WG',  'WG-B',  null),
  ('00000000-0000-0000-0000-000000000009', 'HJN',    'YG',  'YG-A',  '00000000-0000-0000-0001-000000000003'),
  ('00000000-0000-0000-0000-000000000010', 'GYJN',   'YG',  'YG-B',  '00000000-0000-0000-0001-000000000005'),
  ('00000000-0000-0000-0000-000000000011', 'HJN',    'SNG', 'SNG-A', '00000000-0000-0000-0001-000000000004'),
  ('00000000-0000-0000-0000-000000000012', 'MEMBER', 'SNG', 'SNG-B', null);

-- =============================================================
-- EXEMPTIONS  (Samuel, m12)
-- =============================================================

INSERT INTO exemptions (member_id, type, start_date, end_date, approved_by, notes) VALUES
  ('00000000-0000-0000-0000-000000000012', 'Medical', '2024-01-01', '2024-06-01',
   '00000000-0000-0000-0000-000000000001', null);

-- =============================================================
-- ATTENDANCE  (deterministic seed for 4 weeks × 3 service types × 12 members)
-- Pattern per member:
--   Active   → cycles through physical/physical/online/physical/absent
--   Absentee → absent
--   Exempted → exempted
-- =============================================================

DO $$
DECLARE
  m_ids     uuid[]  := ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000012'::uuid
  ];
  statuses  text[]  := ARRAY['Active','Active','Active','Active','Active','Active','Active','Absentee','Active','Active','Active','Exempted'];
  weeks     date[]  := ARRAY['2024-03-04'::date,'2024-03-11','2024-03-18','2024-03-25'];
  svc_types text[]  := ARRAY['wed_morning','wed_evening','sun'];
  cycle     text[]  := ARRAY['physical','physical','online','physical','absent'];
  gsn_id    uuid    := '00000000-0000-0000-0000-000000000001';
  m_idx     int;
  s_idx     int;
  w_idx     int;
  att       text;
BEGIN
  FOR m_idx IN 1..12 LOOP
    FOR w_idx IN 1..4 LOOP
      FOR s_idx IN 1..3 LOOP
        IF statuses[m_idx] = 'Exempted' THEN
          att := 'exempted';
        ELSIF statuses[m_idx] = 'Absentee' THEN
          att := 'absent';
        ELSE
          att := cycle[((m_idx + w_idx + s_idx - 3) % 5) + 1];
        END IF;

        INSERT INTO attendance (member_id, service_date, service_type, attendance_type, recorded_by)
        VALUES (m_ids[m_idx], weeks[w_idx], svc_types[s_idx], att, gsn_id);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================
-- DAILY_BREAD  (Mon/Tue/Thu/Fri for 4 weeks × 12 members)
-- =============================================================

DO $$
DECLARE
  m_ids   uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000012'::uuid
  ];
  -- Week start (Monday) → offsets for Mon(0), Tue(1), Thu(3), Fri(4)
  weeks    date[]    := ARRAY['2024-03-04'::date,'2024-03-11','2024-03-18','2024-03-25'];
  offsets  integer[] := ARRAY[0, 1, 3, 4];
  gsn_id   uuid      := '00000000-0000-0000-0000-000000000001';
  m_idx    int;
  w_idx    int;
  d_idx    int;
  db_date  date;
  watched  boolean;
BEGIN
  FOR m_idx IN 1..12 LOOP
    FOR w_idx IN 1..4 LOOP
      FOR d_idx IN 1..4 LOOP
        db_date := weeks[w_idx] + offsets[d_idx];
        watched  := ((m_idx + w_idx + d_idx) % 3) <> 0;  -- ~67% watched
        INSERT INTO daily_bread (member_id, date, watched, is_flex_day, recorded_by)
        VALUES (m_ids[m_idx], db_date, watched, false, gsn_id);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================
-- EVANGELISM_PROSPECTS
-- =============================================================

INSERT INTO evangelism_prospects (prospect_name, linked_member_id, stage, stage_entered_date, department) VALUES
  ('Kagiso Mabena',   '00000000-0000-0000-0000-000000000004', 'bucket',           '2024-03-01', 'MG'),
  ('Lindiwe Zulu',    '00000000-0000-0000-0000-000000000006', 'pickup',           '2024-02-20', 'WG'),
  ('Peter Moloi',     '00000000-0000-0000-0000-000000000003', 'bb',               '2024-02-15', 'MG'),
  ('Nomsa Sithole',   '00000000-0000-0000-0000-000000000005', 'read_for_centre',  '2024-02-10', 'WG'),
  ('Bongani Langa',   '00000000-0000-0000-0000-000000000009', 'centre',           '2024-01-25', 'YG'),
  ('Thandiwe Nkomo',  '00000000-0000-0000-0000-000000000010', 'passover',         '2024-01-10', 'YG'),
  ('James Radebe',    '00000000-0000-0000-0000-000000000011', 'bb',               '2024-03-05', 'SNG'),
  ('Refilwe Tau',     '00000000-0000-0000-0000-000000000007', 'pickup',           '2024-03-10', 'WG');

-- =============================================================
-- TEST_RESULTS
-- =============================================================

INSERT INTO test_results (member_id, test_name, date_written, score, pass, rewrite_required, ministry) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Level 1 Foundation',         '2024-02-15', 88, true,  false, 'education'),
  ('00000000-0000-0000-0000-000000000006', 'Level 1 Foundation',         '2024-02-15', 72, true,  false, 'education'),
  ('00000000-0000-0000-0000-000000000009', 'Level 2 Intermediate',       '2024-03-01', 45, false, true,  'education'),
  ('00000000-0000-0000-0000-000000000010', 'Level 1 Foundation',         '2024-03-01', 91, true,  false, 'education'),
  ('00000000-0000-0000-0000-000000000004', 'Pre-member Theology Basics', '2024-02-20', 65, true,  false, 'theology'),
  ('00000000-0000-0000-0000-000000000012', 'Level 1 Foundation',         '2024-01-20', 55, false, true,  'education');

-- =============================================================
-- ANNOUNCEMENTS
-- =============================================================

INSERT INTO announcements (id, title, body, created_by, created_at, recipient_group, telegram_sent) VALUES
  ('00000000-0000-0000-0003-000000000001',
   'Sunday Service Time Change',
   'Please note that Sunday service will now start at 12:00 instead of 10:00 effective from next week.',
   '00000000-0000-0000-0000-000000000001', '2024-03-20T10:00:00Z', 'all', true),

  ('00000000-0000-0000-0003-000000000002',
   'Youth Group Camp Registration',
   'Youth camp registration is now open. Please register by March 30th. Contact Tshepiso for details.',
   '00000000-0000-0000-0000-000000000002', '2024-03-18T14:30:00Z', 'YG', true),

  ('00000000-0000-0000-0003-000000000003',
   'Finance Report Deadline',
   'All ministry leaders please submit your finance reports by end of March.',
   '00000000-0000-0000-0000-000000000001', '2024-03-15T09:00:00Z', 'all', false);

-- =============================================================
-- ANNOUNCEMENT_READS
-- =============================================================

INSERT INTO announcement_reads (announcement_id, member_id, read_at) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', '2024-03-20T12:00:00Z'),
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000005', '2024-03-20T13:00:00Z'),
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000006', '2024-03-21T08:00:00Z'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000009', '2024-03-19T10:00:00Z'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000010', '2024-03-19T11:00:00Z');

-- =============================================================
-- FINANCE_CLAIMS
-- =============================================================

INSERT INTO finance_claims (submitted_by, amount, category, status, date_submitted, notes) VALUES
  ('00000000-0000-0000-0000-000000000005', 1500, 'Transport', 'approved', '2024-03-10', 'Bus hire for event'),
  ('00000000-0000-0000-0000-000000000003',  800, 'Supplies',  'pending',  '2024-03-15', 'Stationery for education dept'),
  ('00000000-0000-0000-0000-000000000009', 3200, 'Catering',  'paid',     '2024-03-05', 'Youth camp food');

-- =============================================================
-- CONSTRUCTION_PROJECTS
-- =============================================================

INSERT INTO construction_projects (name, status, start_date, budget, actual_spend) VALUES
  ('Church Hall Extension', 'In Progress', '2024-01-15', 250000, 175000),
  ('Parking Lot Upgrade',   'Planning',    '2024-04-01',  80000,      0);

-- =============================================================
-- ROLE_CHANGE_REQUESTS
-- =============================================================

INSERT INTO role_change_requests
  (member_id, requested_by, "current_role", proposed_role, proposed_department, proposed_cell, proposed_ministry_id, status, reviewed_by, reviewed_at, rejection_reason, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000002',
   'MEMBER', 'GYJN', 'WG', 'WG-B', null,
   'pending', null, null, null, '2024-03-18');
