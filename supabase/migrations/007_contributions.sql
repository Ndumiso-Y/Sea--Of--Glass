-- =============================================================
-- 007_contributions.sql
-- Tithe & Offering tracking module.
-- Tables: contribution_types, contributions, special_offering_access
-- Includes: banking-cutoff function, RLS, and 3-month seed data.
-- =============================================================

-- ── 1. contribution_types ─────────────────────────────────────────────────────
CREATE TABLE contribution_types (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  is_special    boolean     NOT NULL DEFAULT false,
  target_amount numeric,
  start_date    date,
  end_date      date,
  is_active     boolean     NOT NULL DEFAULT true,
  created_by    uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

-- ── 2. contributions ──────────────────────────────────────────────────────────
CREATE TABLE contributions (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   uuid        NOT NULL REFERENCES members(id)             ON DELETE CASCADE,
  contribution_type_id        uuid        NOT NULL REFERENCES contribution_types(id)  ON DELETE RESTRICT,
  amount                      numeric     NOT NULL CHECK (amount > 0),
  payment_date                date        NOT NULL,
  contribution_month          date        NOT NULL,
  -- first day of the month this contribution counts towards (auto-set by trigger)
  is_provisional              boolean     NOT NULL DEFAULT false,
  -- true = member self-reported; false = captured by Finance
  provisional_confirmed_by    uuid        REFERENCES members(id) ON DELETE SET NULL,
  provisional_confirmed_at    timestamptz,
  provisional_rejected_by     uuid        REFERENCES members(id) ON DELETE SET NULL,
  provisional_rejected_at     timestamptz,
  provisional_rejection_reason text,
  status                      text        NOT NULL DEFAULT 'confirmed'
                              CHECK (status IN ('confirmed','provisional','rejected')),
  department                  text        NOT NULL,
  notes                       text,
  captured_by                 uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

CREATE INDEX idx_contributions_member        ON contributions(member_id);
CREATE INDEX idx_contributions_month         ON contributions(contribution_month);
CREATE INDEX idx_contributions_dept          ON contributions(department);
CREATE INDEX idx_contributions_type          ON contributions(contribution_type_id);
CREATE INDEX idx_contributions_status        ON contributions(status);

-- ── 3. special_offering_access ────────────────────────────────────────────────
CREATE TABLE special_offering_access (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_type_id uuid        NOT NULL REFERENCES contribution_types(id) ON DELETE CASCADE,
  department           text        NOT NULL,
  created_at           timestamptz DEFAULT now(),
  UNIQUE (contribution_type_id, department)
);

-- =============================================================
-- BANKING CUTOFF FUNCTION
-- Last Friday of month: if payment > last Friday → next month
-- =============================================================

CREATE OR REPLACE FUNCTION get_contribution_month(p_date date)
RETURNS date
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  last_day    date;
  dow_last    int;
  last_friday date;
BEGIN
  -- Last calendar day of the payment month
  last_day := (DATE_TRUNC('month', p_date) + INTERVAL '1 month' - INTERVAL '1 day')::date;

  -- Day-of-week (0=Sun, 1=Mon ... 5=Fri, 6=Sat)
  dow_last := EXTRACT(DOW FROM last_day)::int;

  -- Number of days to subtract to reach the last Friday
  -- (dow_last - 5 + 7) % 7  works for every day of the week
  last_friday := last_day - ((dow_last - 5 + 7) % 7);

  IF p_date > last_friday THEN
    -- After banking cutoff → counts for next month
    RETURN (DATE_TRUNC('month', p_date) + INTERVAL '1 month')::date;
  ELSE
    RETURN DATE_TRUNC('month', p_date)::date;
  END IF;
END;
$$;

-- Quick self-test (will raise exception if wrong):
-- March 2026: last day Tue 31, last Friday 27
--   get_contribution_month('2026-03-27') = 2026-03-01  ✓
--   get_contribution_month('2026-03-28') = 2026-04-01  ✓
--   get_contribution_month('2026-03-15') = 2026-03-01  ✓
-- January 2026: last day Sat 31, last Friday 30
--   get_contribution_month('2026-01-30') = 2026-01-01  ✓
--   get_contribution_month('2026-01-31') = 2026-02-01  ✓

DO $$
BEGIN
  ASSERT get_contribution_month('2026-03-27'::date) = '2026-03-01'::date,
    'FAIL: March 27 (last Friday) should map to March 2026';
  ASSERT get_contribution_month('2026-03-28'::date) = '2026-04-01'::date,
    'FAIL: March 28 (after last Friday) should map to April 2026';
  ASSERT get_contribution_month('2026-03-15'::date) = '2026-03-01'::date,
    'FAIL: March 15 should map to March 2026';
  ASSERT get_contribution_month('2026-01-30'::date) = '2026-01-01'::date,
    'FAIL: Jan 30 (last Friday of Jan 2026) should map to January 2026';
  ASSERT get_contribution_month('2026-01-31'::date) = '2026-02-01'::date,
    'FAIL: Jan 31 (Saturday after last Friday) should map to February 2026';
END $$;

-- ── Trigger: auto-set contribution_month on INSERT / payment_date UPDATE ──────

CREATE OR REPLACE FUNCTION tr_set_contribution_month()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.contribution_month := get_contribution_month(NEW.payment_date);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_contributions_set_month
  BEFORE INSERT OR UPDATE OF payment_date
  ON contributions
  FOR EACH ROW EXECUTE FUNCTION tr_set_contribution_month();

-- ── Trigger: auto-set updated_at on UPDATE ────────────────────────────────────

CREATE OR REPLACE FUNCTION tr_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_contributions_updated_at
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION tr_set_updated_at();

-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

-- True if the current user belongs to the Finance ministry (any role)
CREATE OR REPLACE FUNCTION is_finance_ministry()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM ministries m
    WHERE m.id = get_my_ministry_id()
      AND m.name = 'Finance'
  )
$$;

-- True if the current user is the designated BJN (head) of the Finance ministry
CREATE OR REPLACE FUNCTION is_finance_bjn()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT get_my_member_id() IN (
    SELECT bjn_member_id
    FROM   ministries
    WHERE  name = 'Finance'
      AND  bjn_member_id IS NOT NULL
  )
$$;

-- =============================================================
-- ROW-LEVEL SECURITY
-- =============================================================

ALTER TABLE contribution_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offering_access ENABLE ROW LEVEL SECURITY;

-- ── contribution_types ────────────────────────────────────────────────────────

-- GSN: full access
CREATE POLICY "ct_gsn_all"
  ON contribution_types FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

-- Finance BJN (head of Finance ministry): full access
CREATE POLICY "ct_finance_bjn_all"
  ON contribution_types FOR ALL
  USING     (is_finance_bjn())
  WITH CHECK(is_finance_bjn());

-- All other authenticated users: read active types (needed for dropdowns)
CREATE POLICY "ct_auth_select"
  ON contribution_types FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- ── special_offering_access ───────────────────────────────────────────────────

-- GSN: full access
CREATE POLICY "soa_gsn_all"
  ON special_offering_access FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

-- Finance BJN: full access
CREATE POLICY "soa_finance_bjn_all"
  ON special_offering_access FOR ALL
  USING     (is_finance_bjn())
  WITH CHECK(is_finance_bjn());

-- HJN: read only rows matching their department
CREATE POLICY "soa_hjn_select"
  ON special_offering_access FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    get_my_role() = 'HJN' AND
    department = get_my_department()
  );

-- ── contributions ─────────────────────────────────────────────────────────────

-- GSN: unrestricted read + write on ALL rows
CREATE POLICY "contrib_gsn_all"
  ON contributions FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

-- Finance BJN (head of Finance ministry): unrestricted read + write
CREATE POLICY "contrib_finance_bjn_all"
  ON contributions FOR ALL
  USING     (is_finance_bjn())
  WITH CHECK(is_finance_bjn());

-- Finance ministry members (not the BJN): SELECT + INSERT + UPDATE, no DELETE
CREATE POLICY "contrib_finance_member_select"
  ON contributions FOR SELECT
  USING (is_finance_ministry() AND NOT is_finance_bjn());

CREATE POLICY "contrib_finance_member_insert"
  ON contributions FOR INSERT
  WITH CHECK (is_finance_ministry() AND NOT is_finance_bjn());

CREATE POLICY "contrib_finance_member_update"
  ON contributions FOR UPDATE
  USING     (is_finance_ministry() AND NOT is_finance_bjn())
  WITH CHECK (is_finance_ministry() AND NOT is_finance_bjn());

-- HJN: read their department's contributions
--   Non-special types: always visible for their dept
--   Special types: only if department has access via special_offering_access
CREATE POLICY "contrib_hjn_select"
  ON contributions FOR SELECT
  USING (
    get_my_role() = 'HJN' AND
    department = get_my_department() AND
    (
      -- Contribution type is non-special
      EXISTS (
        SELECT 1 FROM contribution_types ct
        WHERE ct.id = contributions.contribution_type_id
          AND ct.is_special = false
      ) OR
      -- Contribution type is special but dept has been granted access
      EXISTS (
        SELECT 1 FROM special_offering_access soa
        WHERE soa.contribution_type_id = contributions.contribution_type_id
          AND soa.department = get_my_department()
      )
    )
  );

-- MEMBER: read their OWN contributions only, excluding rejected records
CREATE POLICY "contrib_member_select"
  ON contributions FOR SELECT
  USING (
    member_id = get_my_member_id() AND
    status <> 'rejected'
  );

-- NOTE: SMN has NO policies — they see nothing.

-- =============================================================
-- SEED DATA
-- =============================================================

-- ── Contribution types (fixed UUIDs) ─────────────────────────────────────────
INSERT INTO contribution_types (id, name, description, is_special, is_active) VALUES
  ('00000000-0000-0000-0003-000000000001', 'Tithe',
   'Mandatory 10% of income offering', false, true),
  ('00000000-0000-0000-0003-000000000002', 'Construction',
   'Building fund for church premises', false, true),
  ('00000000-0000-0000-0003-000000000003', 'Missions',
   'Support for domestic and international missions', false, true),
  ('00000000-0000-0000-0003-000000000004', 'Thanksgiving Offering',
   'Special thanksgiving and gratitude offering', false, true),
  ('00000000-0000-0000-0003-000000000005', 'Service Offering',
   'Regular service collection offering', false, true),
  ('00000000-0000-0000-0003-000000000006', 'Building Fund Drive 2026',
   'Special campaign to raise R200,000 for the new sanctuary',
   true, true);

-- Building Fund target and dates
UPDATE contribution_types
SET target_amount = 200000, start_date = '2026-01-01', end_date = '2026-12-31'
WHERE id = '00000000-0000-0000-0003-000000000006';

-- ── special_offering_access — Building Fund visible to all departments ─────────
INSERT INTO special_offering_access (contribution_type_id, department) VALUES
  ('00000000-0000-0000-0003-000000000006', 'MG'),
  ('00000000-0000-0000-0003-000000000006', 'WG'),
  ('00000000-0000-0000-0003-000000000006', 'YG'),
  ('00000000-0000-0000-0003-000000000006', 'SNG');

-- ── 3-month seed contributions ────────────────────────────────────────────────
-- Members + departments
-- m1  Thabo    GSN   MG   MG-A   R1500 tithe
-- m2  Sipho    SMN   MG   MG-A   R1200 tithe
-- m3  David    HJN   MG   MG-B   R1000 tithe
-- m4  John     GYJN  MG   MG-B   R800  tithe
-- m5  Naledi   HJN   WG   WG-A   R1800 tithe
-- m6  Lerato   GYJN  WG   WG-A   R700  tithe
-- m7  Palesa   SGN   WG   WG-B   R900  tithe
-- m8  Grace    MEMBER WG  WG-B   R500  tithe
-- m9  Tshepiso HJN   YG   YG-A   R600  tithe
-- m10 Mpho     GYJN  YG   YG-B   R550  tithe
-- m11 Elizabeth HJN  SNG  SNG-A  R1100 tithe
-- m12 Samuel   MEMBER SNG SNG-B  R450  tithe

DO $$
DECLARE
  gsn uuid := '00000000-0000-0000-0000-000000000001';

  -- Member IDs
  m1  uuid := '00000000-0000-0000-0000-000000000001';
  m2  uuid := '00000000-0000-0000-0000-000000000002';
  m3  uuid := '00000000-0000-0000-0000-000000000003';
  m4  uuid := '00000000-0000-0000-0000-000000000004';
  m5  uuid := '00000000-0000-0000-0000-000000000005';
  m6  uuid := '00000000-0000-0000-0000-000000000006';
  m7  uuid := '00000000-0000-0000-0000-000000000007';
  m8  uuid := '00000000-0000-0000-0000-000000000008';
  m9  uuid := '00000000-0000-0000-0000-000000000009';
  m10 uuid := '00000000-0000-0000-0000-000000000010';
  m11 uuid := '00000000-0000-0000-0000-000000000011';
  m12 uuid := '00000000-0000-0000-0000-000000000012';

  -- Type IDs
  tithe  uuid := '00000000-0000-0000-0003-000000000001';
  const  uuid := '00000000-0000-0000-0003-000000000002';
  miss   uuid := '00000000-0000-0000-0003-000000000003';
  thanks uuid := '00000000-0000-0000-0003-000000000004';
  svc    uuid := '00000000-0000-0000-0003-000000000005';
  build  uuid := '00000000-0000-0000-0003-000000000006';

  -- Payment dates (all before banking cutoff → same-month contribution_month)
  -- Trigger auto-sets contribution_month
  jan_date  date := '2026-01-15';
  feb_date  date := '2026-02-12';
  mar_date  date := '2026-03-19';

BEGIN

  -- ── Tithe for all 12 members × 3 months ─────────────────────────────────────

  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m1,  tithe, 1500, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m2,  tithe, 1200, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m3,  tithe, 1000, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m4,  tithe,  800, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m5,  tithe, 1800, jan_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(jan_date)),
    (m6,  tithe,  700, jan_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(jan_date)),
    (m7,  tithe,  900, jan_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(jan_date)),
    (m8,  tithe,  500, jan_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(jan_date)),
    (m9,  tithe,  600, jan_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(jan_date)),
    (m10, tithe,  550, jan_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(jan_date)),
    (m11, tithe, 1100, jan_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(jan_date)),
    (m12, tithe,  450, jan_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(jan_date)),

    (m1,  tithe, 1500, feb_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(feb_date)),
    (m2,  tithe, 1200, feb_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(feb_date)),
    (m3,  tithe, 1000, feb_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(feb_date)),
    (m4,  tithe,  800, feb_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(feb_date)),
    (m5,  tithe, 1800, feb_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(feb_date)),
    (m6,  tithe,  700, feb_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(feb_date)),
    (m7,  tithe,  900, feb_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(feb_date)),
    (m8,  tithe,  500, feb_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(feb_date)),
    (m9,  tithe,  600, feb_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(feb_date)),
    (m10, tithe,  550, feb_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(feb_date)),
    (m11, tithe, 1100, feb_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(feb_date)),
    (m12, tithe,  450, feb_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(feb_date)),

    (m1,  tithe, 1500, mar_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(mar_date)),
    (m2,  tithe, 1200, mar_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(mar_date)),
    (m3,  tithe, 1000, mar_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(mar_date)),
    (m4,  tithe,  800, mar_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(mar_date)),
    (m5,  tithe, 1800, mar_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(mar_date)),
    (m6,  tithe,  700, mar_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(mar_date)),
    (m7,  tithe,  900, mar_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(mar_date)),
    (m8,  tithe,  500, mar_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(mar_date)),
    (m9,  tithe,  600, mar_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(mar_date)),
    (m10, tithe,  550, mar_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(mar_date)),
    (m11, tithe, 1100, mar_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(mar_date)),
    (m12, tithe,  450, mar_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(mar_date));

  -- ── Construction — MG members (all 3 months) ──────────────────────────────────
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m1, const, 500, jan_date, false, 'confirmed', 'MG', gsn, get_contribution_month(jan_date)),
    (m2, const, 400, jan_date, false, 'confirmed', 'MG', gsn, get_contribution_month(jan_date)),
    (m3, const, 350, jan_date, false, 'confirmed', 'MG', gsn, get_contribution_month(jan_date)),
    (m4, const, 250, jan_date, false, 'confirmed', 'MG', gsn, get_contribution_month(jan_date)),
    (m1, const, 500, feb_date, false, 'confirmed', 'MG', gsn, get_contribution_month(feb_date)),
    (m2, const, 400, feb_date, false, 'confirmed', 'MG', gsn, get_contribution_month(feb_date)),
    (m3, const, 350, feb_date, false, 'confirmed', 'MG', gsn, get_contribution_month(feb_date)),
    (m4, const, 250, feb_date, false, 'confirmed', 'MG', gsn, get_contribution_month(feb_date)),
    (m1, const, 500, mar_date, false, 'confirmed', 'MG', gsn, get_contribution_month(mar_date)),
    (m2, const, 400, mar_date, false, 'confirmed', 'MG', gsn, get_contribution_month(mar_date)),
    (m3, const, 350, mar_date, false, 'confirmed', 'MG', gsn, get_contribution_month(mar_date)),
    (m4, const, 250, mar_date, false, 'confirmed', 'MG', gsn, get_contribution_month(mar_date));

  -- ── Missions — WG and YG members (Jan + Mar) ─────────────────────────────────
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m5, miss, 250, jan_date, false, 'confirmed', 'WG', gsn, get_contribution_month(jan_date)),
    (m6, miss, 150, jan_date, false, 'confirmed', 'WG', gsn, get_contribution_month(jan_date)),
    (m9, miss, 200, jan_date, false, 'confirmed', 'YG', gsn, get_contribution_month(jan_date)),
    (m5, miss, 250, mar_date, false, 'confirmed', 'WG', gsn, get_contribution_month(mar_date)),
    (m9, miss, 200, mar_date, false, 'confirmed', 'YG', gsn, get_contribution_month(mar_date)),
    (m11,miss, 180, mar_date, false, 'confirmed', 'SNG',gsn, get_contribution_month(mar_date));

  -- ── Thanksgiving — select members, January only ───────────────────────────────
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m1,  thanks, 500, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m3,  thanks, 300, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m5,  thanks, 600, jan_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(jan_date)),
    (m11, thanks, 400, jan_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(jan_date));

  -- ── Service Offering — random members across months ───────────────────────────
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m1, svc, 150, jan_date, false, 'confirmed', 'MG', gsn, get_contribution_month(jan_date)),
    (m5, svc, 200, jan_date, false, 'confirmed', 'WG', gsn, get_contribution_month(jan_date)),
    (m9, svc, 100, feb_date, false, 'confirmed', 'YG', gsn, get_contribution_month(feb_date)),
    (m3, svc, 120, feb_date, false, 'confirmed', 'MG', gsn, get_contribution_month(feb_date)),
    (m11,svc, 180, mar_date, false, 'confirmed', 'SNG',gsn, get_contribution_month(mar_date)),
    (m7, svc,  80, mar_date, false, 'confirmed', 'WG', gsn, get_contribution_month(mar_date));

  -- ── Building Fund Special Offering ────────────────────────────────────────────
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m1,  build, 1000, jan_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(jan_date)),
    (m5,  build,  800, jan_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(jan_date)),
    (m11, build,  500, jan_date, false, 'confirmed', 'SNG', gsn, get_contribution_month(jan_date)),
    (m3,  build,  600, feb_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(feb_date)),
    (m9,  build,  400, feb_date, false, 'confirmed', 'YG',  gsn, get_contribution_month(feb_date)),
    (m1,  build, 1000, mar_date, false, 'confirmed', 'MG',  gsn, get_contribution_month(mar_date)),
    (m5,  build,  800, mar_date, false, 'confirmed', 'WG',  gsn, get_contribution_month(mar_date));

  -- ── Provisional records ────────────────────────────────────────────────────────
  -- Grace (m8) self-reported March tithe after cutoff → counts for April 2026
  -- payment_date 2026-03-29 is after last Friday (Mar 27) → contribution_month = 2026-04-01
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m8, tithe, 500, '2026-03-29', true, 'provisional', 'WG', NULL, get_contribution_month('2026-03-29'));

  -- Lerato (m6) had a provisional tithe in February, was later rejected
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department,
    captured_by, provisional_rejected_by, provisional_rejected_at, provisional_rejection_reason, contribution_month)
  VALUES (m6, tithe, 700, '2026-02-25', true, 'rejected', 'WG',
    NULL, gsn, '2026-03-02 10:00:00+02', 'Duplicate entry — already recorded on 12 Feb', get_contribution_month('2026-02-25'));

  -- Mpho (m10) self-reported Construction in March — still pending
  INSERT INTO contributions (member_id, contribution_type_id, amount, payment_date, is_provisional, status, department, captured_by, contribution_month) VALUES
    (m10, const, 200, '2026-03-10', true, 'provisional', 'YG', NULL, get_contribution_month('2026-03-10'));

END $$;
