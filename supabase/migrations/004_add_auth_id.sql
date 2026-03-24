-- =============================================================
-- 004_add_auth_id.sql
-- Adds auth_id to members so auth.uid() is decoupled from members.id,
-- allowing production members to have their own UUID while linking
-- to auth.users via a separate FK column.
--
-- Also updates all RLS helper functions and policies that previously
-- compared member UUIDs directly against auth.uid().
-- =============================================================

-- ── 1. Add auth_id column ─────────────────────────────────────────────────────
ALTER TABLE members
  ADD COLUMN auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX ON members(auth_id);

-- ── 2. Backfill for seed data (members.id was set = auth.users.id) ────────────
UPDATE members
SET    auth_id = id
WHERE  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = members.id);

-- ── 3. Add get_my_member_id() — maps auth.uid() → members.id ─────────────────
-- All other helpers and policies now call this instead of comparing
-- member_id / id columns directly against auth.uid().
CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM members WHERE auth_id = auth.uid()
$$;

-- ── 4. Update role/department/cell/ministry helpers ───────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_roles WHERE member_id = get_my_member_id()
$$;

CREATE OR REPLACE FUNCTION get_my_department()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT department FROM user_roles WHERE member_id = get_my_member_id()
$$;

CREATE OR REPLACE FUNCTION get_my_cell()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT cell FROM user_roles WHERE member_id = get_my_member_id()
$$;

CREATE OR REPLACE FUNCTION get_my_ministry_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT ministry_id FROM user_roles WHERE member_id = get_my_member_id()
$$;

CREATE OR REPLACE FUNCTION is_evangelism_bjn()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   user_roles ur
    JOIN   ministries m ON ur.ministry_id = m.id
    WHERE  ur.member_id     = get_my_member_id()
      AND  ur.role          = 'BJN'
      AND  m.abbreviation   = 'EVAN'
  )
$$;

-- ── 5. Update trigger functions ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_check_culture_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM user_roles WHERE member_id = get_my_member_id()) = 'CULTURE' THEN
    IF (
      NEW.name            IS DISTINCT FROM OLD.name            OR
      NEW.scj_number      IS DISTINCT FROM OLD.scj_number      OR
      NEW.email           IS DISTINCT FROM OLD.email           OR
      NEW.phone           IS DISTINCT FROM OLD.phone           OR
      NEW.telegram_handle IS DISTINCT FROM OLD.telegram_handle OR
      NEW.department      IS DISTINCT FROM OLD.department      OR
      NEW.cell            IS DISTINCT FROM OLD.cell            OR
      NEW.duty_title      IS DISTINCT FROM OLD.duty_title      OR
      NEW.ga_status       IS DISTINCT FROM OLD.ga_status       OR
      NEW.is_pastor       IS DISTINCT FROM OLD.is_pastor       OR
      NEW.status          IS DISTINCT FROM OLD.status          OR
      NEW.created_at      IS DISTINCT FROM OLD.created_at
    ) THEN
      RAISE EXCEPTION 'CULTURE role may only update profile_image_url';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_check_smn_duty_history_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM user_roles WHERE member_id = get_my_member_id()) = 'SMN' THEN
    IF (
      NEW.member_id         IS DISTINCT FROM OLD.member_id         OR
      NEW.role              IS DISTINCT FROM OLD.role              OR
      NEW.department        IS DISTINCT FROM OLD.department        OR
      NEW.cell              IS DISTINCT FROM OLD.cell              OR
      NEW.ministry_id       IS DISTINCT FROM OLD.ministry_id       OR
      NEW.appointed_date    IS DISTINCT FROM OLD.appointed_date    OR
      NEW.appointed_by      IS DISTINCT FROM OLD.appointed_by      OR
      NEW.approved_by       IS DISTINCT FROM OLD.approved_by       OR
      NEW.reason_for_change IS DISTINCT FROM OLD.reason_for_change OR
      NEW.created_at        IS DISTINCT FROM OLD.created_at
    ) THEN
      RAISE EXCEPTION 'SMN may only update ended_date on member_duty_history';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 6. Update RLS policies that compared member columns against auth.uid() ────

-- MEMBERS: self-select now uses auth_id column
DROP POLICY "members_self_select" ON members;
CREATE POLICY "members_self_select"
  ON members FOR SELECT
  USING (auth_id = auth.uid());

-- USER_ROLES
DROP POLICY "user_roles_member_select" ON user_roles;
CREATE POLICY "user_roles_member_select"
  ON user_roles FOR SELECT
  USING (member_id = get_my_member_id());

-- MEMBER_DUTY_HISTORY
DROP POLICY "mdh_member_select" ON member_duty_history;
CREATE POLICY "mdh_member_select"
  ON member_duty_history FOR SELECT
  USING (member_id = get_my_member_id());

-- ATTENDANCE
DROP POLICY "attendance_member_select" ON attendance;
CREATE POLICY "attendance_member_select"
  ON attendance FOR SELECT
  USING (member_id = get_my_member_id());

-- DAILY_BREAD
DROP POLICY "daily_bread_member_select" ON daily_bread;
CREATE POLICY "daily_bread_member_select"
  ON daily_bread FOR SELECT
  USING (member_id = get_my_member_id());

-- TEST_RESULTS
DROP POLICY "test_results_member_select" ON test_results;
CREATE POLICY "test_results_member_select"
  ON test_results FOR SELECT
  USING (member_id = get_my_member_id());

-- EXEMPTIONS
DROP POLICY "exemptions_member_select" ON exemptions;
CREATE POLICY "exemptions_member_select"
  ON exemptions FOR SELECT
  USING (member_id = get_my_member_id());

-- ANNOUNCEMENT_READS
DROP POLICY "ann_reads_member_select" ON announcement_reads;
CREATE POLICY "ann_reads_member_select"
  ON announcement_reads FOR SELECT
  USING (member_id = get_my_member_id());

DROP POLICY "ann_reads_member_insert" ON announcement_reads;
CREATE POLICY "ann_reads_member_insert"
  ON announcement_reads FOR INSERT
  WITH CHECK(member_id = get_my_member_id());

-- FINANCE_CLAIMS
DROP POLICY "finance_member_select" ON finance_claims;
CREATE POLICY "finance_member_select"
  ON finance_claims FOR SELECT
  USING (submitted_by = get_my_member_id());

-- ROLE_CHANGE_REQUESTS
DROP POLICY "rcr_member_self_select" ON role_change_requests;
CREATE POLICY "rcr_member_self_select"
  ON role_change_requests FOR SELECT
  USING (member_id = get_my_member_id());
