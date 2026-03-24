-- =============================================================
-- 001_initial_schema.sql
-- Sea of Glass Rustenburg - Initial Schema + RLS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- TABLES
-- =============================================================

CREATE TABLE members (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  scj_number        text        UNIQUE,
  email             text        UNIQUE,
  phone             text,
  telegram_handle   text,
  department        text,
  cell              text,
  duty_title        text,
  ga_status         text,
  is_pastor         boolean     DEFAULT false,
  status            text        DEFAULT 'active',
  profile_image_url text,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE ministries (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text    NOT NULL,
  abbreviation  text,
  is_active     boolean DEFAULT false,
  bjn_member_id uuid    REFERENCES members(id) ON DELETE SET NULL
);

CREATE TABLE member_duty_history (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id          uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role               text        NOT NULL,
  department         text,
  cell               text,
  ministry_id        uuid        REFERENCES ministries(id) ON DELETE SET NULL,
  appointed_date     date,
  ended_date         date,
  appointed_by       uuid        REFERENCES members(id),
  approved_by        uuid        REFERENCES members(id),
  reason_for_change  text,
  created_at         timestamptz DEFAULT now()
);

-- Enforce: only one active (ended_date IS NULL) record per member
CREATE UNIQUE INDEX member_duty_history_active_unique
  ON member_duty_history (member_id)
  WHERE ended_date IS NULL;

CREATE TABLE attendance (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_date    date        NOT NULL,
  service_type    text        NOT NULL,
  attendance_type text        NOT NULL,
  recorded_by     uuid        REFERENCES members(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE daily_bread (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid    NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date        date    NOT NULL,
  watched     boolean DEFAULT false,
  is_flex_day boolean DEFAULT false,
  recorded_by uuid    REFERENCES members(id)
);

CREATE TABLE evangelism_prospects (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_name      text        NOT NULL,
  linked_member_id   uuid        REFERENCES members(id) ON DELETE SET NULL,
  stage              text,
  stage_entered_date date,
  department         text,
  notes              text,
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE test_results (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  test_name        text,
  date_written     date,
  score            numeric,
  pass             boolean,
  rewrite_required boolean     DEFAULT false,
  ministry         text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE exemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type        text,
  start_date  date,
  end_date    date,
  approved_by uuid REFERENCES members(id),
  notes       text
);

CREATE TABLE announcements (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  body            text,
  created_by      uuid        REFERENCES members(id),
  created_at      timestamptz DEFAULT now(),
  recipient_group text,
  telegram_sent   boolean     DEFAULT false
);

CREATE TABLE announcement_reads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid        NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  member_id       uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now(),
  UNIQUE (announcement_id, member_id)
);

CREATE TABLE finance_claims (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by   uuid    REFERENCES members(id),
  amount         numeric,
  category       text,
  status         text    DEFAULT 'pending',
  date_submitted date,
  notes          text
);

CREATE TABLE construction_projects (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text    NOT NULL,
  status       text,
  start_date   date,
  budget       numeric,
  actual_spend numeric DEFAULT 0
);

CREATE TABLE user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  role        text NOT NULL,
  department  text,
  cell        text,
  ministry_id uuid REFERENCES ministries(id) ON DELETE SET NULL
);

CREATE TABLE role_change_requests (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id            uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  requested_by         uuid        REFERENCES members(id),
  "current_role"       text,
  proposed_role        text,
  proposed_department  text,
  proposed_cell        text,
  proposed_ministry_id uuid        REFERENCES ministries(id),
  status               text        DEFAULT 'pending',
  reviewed_by          uuid        REFERENCES members(id),
  reviewed_at          timestamptz,
  rejection_reason     text,
  created_at           timestamptz DEFAULT now()
);

-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto-close previous active duty history when a new record (ended_date IS NULL) is inserted.
-- On role approval: call this by inserting a new member_duty_history row with ended_date = NULL;
-- the trigger sets ended_date = CURRENT_DATE on the previous active record automatically.
CREATE OR REPLACE FUNCTION fn_close_previous_duty_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ended_date IS NULL THEN
    UPDATE member_duty_history
    SET    ended_date = CURRENT_DATE
    WHERE  member_id  = NEW.member_id
      AND  ended_date IS NULL
      AND  id         <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_close_previous_duty_history
  AFTER INSERT ON member_duty_history
  FOR EACH ROW EXECUTE FUNCTION fn_close_previous_duty_history();

-- Prevent Culture role from modifying any column other than profile_image_url.
CREATE OR REPLACE FUNCTION fn_check_culture_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM user_roles WHERE member_id = auth.uid()) = 'CULTURE' THEN
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

CREATE TRIGGER tr_check_culture_update
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION fn_check_culture_update();

-- Prevent SMN from modifying columns other than ended_date on member_duty_history.
CREATE OR REPLACE FUNCTION fn_check_smn_duty_history_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM user_roles WHERE member_id = auth.uid()) = 'SMN' THEN
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

CREATE TRIGGER tr_check_smn_duty_history_update
  BEFORE UPDATE ON member_duty_history
  FOR EACH ROW EXECUTE FUNCTION fn_check_smn_duty_history_update();

-- =============================================================
-- APPROVAL FLOW STORED PROCEDURES
-- =============================================================

-- GSN calls this to approve a role change request.
-- Atomically: updates request status, inserts new duty history (trigger auto-closes previous),
-- and upserts user_roles + members.
CREATE OR REPLACE FUNCTION approve_role_change(request_id uuid, approver_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  req role_change_requests%ROWTYPE;
BEGIN
  SELECT * INTO req FROM role_change_requests WHERE id = request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role change request not found: %', request_id;
  END IF;
  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current status: %)', req.status;
  END IF;

  UPDATE role_change_requests
  SET    status      = 'approved',
         reviewed_by = approver_id,
         reviewed_at = now()
  WHERE  id = request_id;

  -- Insert new duty history; trigger auto-closes previous active record
  INSERT INTO member_duty_history
    (member_id, role, department, cell, ministry_id, appointed_date, appointed_by, approved_by, reason_for_change)
  VALUES
    (req.member_id, req.proposed_role, req.proposed_department, req.proposed_cell,
     req.proposed_ministry_id, CURRENT_DATE, req.requested_by, approver_id,
     'Role change approved via request ' || request_id::text);

  INSERT INTO user_roles (member_id, role, department, cell, ministry_id)
  VALUES (req.member_id, req.proposed_role, req.proposed_department, req.proposed_cell, req.proposed_ministry_id)
  ON CONFLICT (member_id) DO UPDATE SET
    role        = EXCLUDED.role,
    department  = EXCLUDED.department,
    cell        = EXCLUDED.cell,
    ministry_id = EXCLUDED.ministry_id;

  UPDATE members
  SET    duty_title = req.proposed_role,
         department = req.proposed_department,
         cell       = req.proposed_cell
  WHERE  id = req.member_id;
END;
$$;

CREATE OR REPLACE FUNCTION reject_role_change(request_id uuid, approver_id uuid, reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE role_change_requests
  SET    status           = 'rejected',
         reviewed_by      = approver_id,
         reviewed_at      = now(),
         rejection_reason = reason
  WHERE  id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending: %', request_id;
  END IF;
END;
$$;

-- =============================================================
-- STORAGE BUCKET
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_auth_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "profile_images_auth_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- =============================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_duty_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bread          ENABLE ROW LEVEL SECURITY;
ALTER TABLE evangelism_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE exemptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_claims       ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- HELPER FUNCTIONS  (SECURITY DEFINER: run as owner, bypass RLS)
-- =============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_roles WHERE member_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_department()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT department FROM user_roles WHERE member_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_cell()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT cell FROM user_roles WHERE member_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_ministry_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT ministry_id FROM user_roles WHERE member_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_evangelism_bjn()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   user_roles ur
    JOIN   ministries m ON ur.ministry_id = m.id
    WHERE  ur.member_id = auth.uid()
      AND  ur.role       = 'BJN'
      AND  m.abbreviation = 'EVAN'
  )
$$;

-- True if member m_id belongs to the caller's department (members table)
CREATE OR REPLACE FUNCTION member_in_my_dept(m_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM members WHERE id = m_id AND department = get_my_department()
  )
$$;

-- True if member m_id belongs to the caller's cell (members table)
CREATE OR REPLACE FUNCTION member_in_my_cell(m_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM members WHERE id = m_id AND cell = get_my_cell()
  )
$$;

-- True if member m_id is in the caller's ministry (user_roles table)
CREATE OR REPLACE FUNCTION member_in_my_ministry(m_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE member_id = m_id AND ministry_id = get_my_ministry_id()
  )
$$;

-- =============================================================
-- RLS POLICIES
-- =============================================================

-- ───────────────────────────── MEMBERS ──────────────────────────────
-- NOTE: Column-level restriction for CULTURE (name + profile_image_url only)
-- cannot be enforced by RLS alone. Use the `members_public` view below
-- for CULTURE role queries, and enforce via the check trigger above.

CREATE POLICY "members_gsn_smn"
  ON members FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "members_hjn_select"
  ON members FOR SELECT
  USING (get_my_role() = 'HJN' AND department = get_my_department());

CREATE POLICY "members_hjn_update"
  ON members FOR UPDATE
  USING     (get_my_role() = 'HJN' AND department = get_my_department())
  WITH CHECK(get_my_role() = 'HJN' AND department = get_my_department());

CREATE POLICY "members_gyjn_select"
  ON members FOR SELECT
  USING (get_my_role() = 'GYJN' AND cell = get_my_cell());

CREATE POLICY "members_gyjn_update"
  ON members FOR UPDATE
  USING     (get_my_role() = 'GYJN' AND cell = get_my_cell())
  WITH CHECK(get_my_role() = 'GYJN' AND cell = get_my_cell());

CREATE POLICY "members_bjn_select"
  ON members FOR SELECT
  USING (get_my_role() = 'BJN' AND member_in_my_ministry(id));

CREATE POLICY "members_bjn_update"
  ON members FOR UPDATE
  USING     (get_my_role() = 'BJN' AND member_in_my_ministry(id))
  WITH CHECK(get_my_role() = 'BJN' AND member_in_my_ministry(id));

-- CULTURE: row-level access to all members (column restriction via view + trigger)
CREATE POLICY "members_culture_select"
  ON members FOR SELECT
  USING (get_my_role() = 'CULTURE');

CREATE POLICY "members_culture_update"
  ON members FOR UPDATE
  USING     (get_my_role() = 'CULTURE')
  WITH CHECK(get_my_role() = 'CULTURE');

-- Members: own row only
CREATE POLICY "members_self_select"
  ON members FOR SELECT
  USING (id = auth.uid());

-- ───────────────────────────── MINISTRIES ───────────────────────────
-- All authenticated users can view ministries
CREATE POLICY "ministries_authenticated_select"
  ON ministries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ministries_gsn_write"
  ON ministries FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

-- ───────────────────────────── MEMBER_DUTY_HISTORY ──────────────────
CREATE POLICY "mdh_gsn"
  ON member_duty_history FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

CREATE POLICY "mdh_smn_select"
  ON member_duty_history FOR SELECT
  USING (get_my_role() = 'SMN');

-- SMN may update ended_date on past (ended_date IS NOT NULL) records only.
-- Column guard enforced by fn_check_smn_duty_history_update trigger.
CREATE POLICY "mdh_smn_update_past"
  ON member_duty_history FOR UPDATE
  USING     (get_my_role() = 'SMN' AND ended_date IS NOT NULL)
  WITH CHECK(get_my_role() = 'SMN');

-- SMN can insert as part of an approved role-change workflow
CREATE POLICY "mdh_smn_insert"
  ON member_duty_history FOR INSERT
  WITH CHECK(get_my_role() = 'SMN');

CREATE POLICY "mdh_hjn_select"
  ON member_duty_history FOR SELECT
  USING (get_my_role() = 'HJN' AND department = get_my_department());

CREATE POLICY "mdh_hjn_insert"
  ON member_duty_history FOR INSERT
  WITH CHECK(get_my_role() = 'HJN' AND department = get_my_department());

CREATE POLICY "mdh_gyjn_select"
  ON member_duty_history FOR SELECT
  USING (get_my_role() = 'GYJN' AND cell = get_my_cell());

CREATE POLICY "mdh_bjn_select"
  ON member_duty_history FOR SELECT
  USING (get_my_role() = 'BJN' AND member_in_my_ministry(member_id));

CREATE POLICY "mdh_member_select"
  ON member_duty_history FOR SELECT
  USING (member_id = auth.uid());

-- ───────────────────────────── ATTENDANCE ───────────────────────────
CREATE POLICY "attendance_gsn_smn"
  ON attendance FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "attendance_hjn"
  ON attendance FOR ALL
  USING     (get_my_role() = 'HJN' AND member_in_my_dept(member_id))
  WITH CHECK(get_my_role() = 'HJN' AND member_in_my_dept(member_id));

CREATE POLICY "attendance_gyjn"
  ON attendance FOR ALL
  USING     (get_my_role() = 'GYJN' AND member_in_my_cell(member_id))
  WITH CHECK(get_my_role() = 'GYJN' AND member_in_my_cell(member_id));

CREATE POLICY "attendance_bjn"
  ON attendance FOR ALL
  USING     (get_my_role() = 'BJN' AND member_in_my_ministry(member_id))
  WITH CHECK(get_my_role() = 'BJN' AND member_in_my_ministry(member_id));

CREATE POLICY "attendance_member_select"
  ON attendance FOR SELECT
  USING (member_id = auth.uid());

-- ───────────────────────────── DAILY_BREAD ──────────────────────────
CREATE POLICY "daily_bread_gsn_smn"
  ON daily_bread FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "daily_bread_hjn"
  ON daily_bread FOR ALL
  USING     (get_my_role() = 'HJN' AND member_in_my_dept(member_id))
  WITH CHECK(get_my_role() = 'HJN' AND member_in_my_dept(member_id));

CREATE POLICY "daily_bread_gyjn"
  ON daily_bread FOR ALL
  USING     (get_my_role() = 'GYJN' AND member_in_my_cell(member_id))
  WITH CHECK(get_my_role() = 'GYJN' AND member_in_my_cell(member_id));

CREATE POLICY "daily_bread_bjn"
  ON daily_bread FOR ALL
  USING     (get_my_role() = 'BJN' AND member_in_my_ministry(member_id))
  WITH CHECK(get_my_role() = 'BJN' AND member_in_my_ministry(member_id));

CREATE POLICY "daily_bread_member_select"
  ON daily_bread FOR SELECT
  USING (member_id = auth.uid());

-- ───────────────────────────── EVANGELISM_PROSPECTS ─────────────────
CREATE POLICY "ep_gsn_smn"
  ON evangelism_prospects FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "ep_hjn"
  ON evangelism_prospects FOR ALL
  USING     (get_my_role() = 'HJN' AND department = get_my_department())
  WITH CHECK(get_my_role() = 'HJN' AND department = get_my_department());

-- Evangelism BJN: can read ALL prospects regardless of department
CREATE POLICY "ep_evangelism_bjn_select"
  ON evangelism_prospects FOR SELECT
  USING (is_evangelism_bjn());

-- Other BJNs: scoped to their department
CREATE POLICY "ep_bjn_dept"
  ON evangelism_prospects FOR ALL
  USING     (get_my_role() = 'BJN' AND NOT is_evangelism_bjn() AND department = get_my_department())
  WITH CHECK(get_my_role() = 'BJN' AND NOT is_evangelism_bjn() AND department = get_my_department());

-- ───────────────────────────── TEST_RESULTS ─────────────────────────
CREATE POLICY "test_results_gsn_smn"
  ON test_results FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "test_results_hjn"
  ON test_results FOR ALL
  USING     (get_my_role() = 'HJN' AND member_in_my_dept(member_id))
  WITH CHECK(get_my_role() = 'HJN' AND member_in_my_dept(member_id));

CREATE POLICY "test_results_gyjn"
  ON test_results FOR ALL
  USING     (get_my_role() = 'GYJN' AND member_in_my_cell(member_id))
  WITH CHECK(get_my_role() = 'GYJN' AND member_in_my_cell(member_id));

CREATE POLICY "test_results_bjn"
  ON test_results FOR ALL
  USING     (get_my_role() = 'BJN' AND member_in_my_ministry(member_id))
  WITH CHECK(get_my_role() = 'BJN' AND member_in_my_ministry(member_id));

CREATE POLICY "test_results_member_select"
  ON test_results FOR SELECT
  USING (member_id = auth.uid());

-- ───────────────────────────── EXEMPTIONS ───────────────────────────
CREATE POLICY "exemptions_gsn_smn"
  ON exemptions FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "exemptions_hjn"
  ON exemptions FOR ALL
  USING     (get_my_role() = 'HJN' AND member_in_my_dept(member_id))
  WITH CHECK(get_my_role() = 'HJN' AND member_in_my_dept(member_id));

CREATE POLICY "exemptions_gyjn"
  ON exemptions FOR ALL
  USING     (get_my_role() = 'GYJN' AND member_in_my_cell(member_id))
  WITH CHECK(get_my_role() = 'GYJN' AND member_in_my_cell(member_id));

CREATE POLICY "exemptions_bjn"
  ON exemptions FOR ALL
  USING     (get_my_role() = 'BJN' AND member_in_my_ministry(member_id))
  WITH CHECK(get_my_role() = 'BJN' AND member_in_my_ministry(member_id));

CREATE POLICY "exemptions_member_select"
  ON exemptions FOR SELECT
  USING (member_id = auth.uid());

-- ───────────────────────────── ANNOUNCEMENTS ────────────────────────
-- GSN/SMN: full access
CREATE POLICY "announcements_gsn_smn"
  ON announcements FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

-- All others: read announcements addressed to 'all' or their department
CREATE POLICY "announcements_select_scoped"
  ON announcements FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    get_my_role() NOT IN ('GSN', 'SMN') AND
    (recipient_group = 'all' OR recipient_group = get_my_department())
  );

-- ───────────────────────────── ANNOUNCEMENT_READS ───────────────────
CREATE POLICY "ann_reads_gsn_smn_select"
  ON announcement_reads FOR SELECT
  USING (get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "ann_reads_member_select"
  ON announcement_reads FOR SELECT
  USING (member_id = auth.uid());

-- Any authenticated user can mark an announcement as read for themselves
CREATE POLICY "ann_reads_member_insert"
  ON announcement_reads FOR INSERT
  WITH CHECK(member_id = auth.uid());

-- ───────────────────────────── FINANCE_CLAIMS ───────────────────────
CREATE POLICY "finance_gsn_smn"
  ON finance_claims FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

CREATE POLICY "finance_hjn"
  ON finance_claims FOR ALL
  USING     (get_my_role() = 'HJN' AND member_in_my_dept(submitted_by))
  WITH CHECK(get_my_role() = 'HJN' AND member_in_my_dept(submitted_by));

CREATE POLICY "finance_gyjn"
  ON finance_claims FOR ALL
  USING     (get_my_role() = 'GYJN' AND member_in_my_cell(submitted_by))
  WITH CHECK(get_my_role() = 'GYJN' AND member_in_my_cell(submitted_by));

CREATE POLICY "finance_bjn"
  ON finance_claims FOR ALL
  USING     (get_my_role() = 'BJN' AND member_in_my_ministry(submitted_by))
  WITH CHECK(get_my_role() = 'BJN' AND member_in_my_ministry(submitted_by));

CREATE POLICY "finance_member_select"
  ON finance_claims FOR SELECT
  USING (submitted_by = auth.uid());

-- ───────────────────────────── CONSTRUCTION_PROJECTS ────────────────
CREATE POLICY "construction_gsn_smn"
  ON construction_projects FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

-- All authenticated users can view projects
CREATE POLICY "construction_read_all"
  ON construction_projects FOR SELECT
  USING (auth.role() = 'authenticated');

-- ───────────────────────────── USER_ROLES ───────────────────────────
-- IMPORTANT: SMN must NOT directly modify user_roles — use role_change_requests + approve_role_change().

CREATE POLICY "user_roles_gsn"
  ON user_roles FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

CREATE POLICY "user_roles_smn_select"
  ON user_roles FOR SELECT
  USING (get_my_role() = 'SMN');

CREATE POLICY "user_roles_hjn_select"
  ON user_roles FOR SELECT
  USING (get_my_role() = 'HJN' AND department = get_my_department());

CREATE POLICY "user_roles_gyjn_select"
  ON user_roles FOR SELECT
  USING (get_my_role() = 'GYJN' AND cell = get_my_cell());

CREATE POLICY "user_roles_bjn_select"
  ON user_roles FOR SELECT
  USING (get_my_role() = 'BJN' AND ministry_id = get_my_ministry_id());

CREATE POLICY "user_roles_member_select"
  ON user_roles FOR SELECT
  USING (member_id = auth.uid());

-- ───────────────────────────── ROLE_CHANGE_REQUESTS ─────────────────
-- GSN: full access (approve/reject by updating status)
CREATE POLICY "rcr_gsn"
  ON role_change_requests FOR ALL
  USING     (get_my_role() = 'GSN')
  WITH CHECK(get_my_role() = 'GSN');

-- SMN: SELECT all, INSERT — but NOT UPDATE (cannot approve/reject) or DELETE
CREATE POLICY "rcr_smn_select"
  ON role_change_requests FOR SELECT
  USING (get_my_role() = 'SMN');

CREATE POLICY "rcr_smn_insert"
  ON role_change_requests FOR INSERT
  WITH CHECK(get_my_role() = 'SMN');

CREATE POLICY "rcr_hjn_select"
  ON role_change_requests FOR SELECT
  USING (get_my_role() = 'HJN' AND proposed_department = get_my_department());

CREATE POLICY "rcr_hjn_insert"
  ON role_change_requests FOR INSERT
  WITH CHECK(get_my_role() = 'HJN' AND proposed_department = get_my_department());

CREATE POLICY "rcr_gyjn_select"
  ON role_change_requests FOR SELECT
  USING (get_my_role() = 'GYJN' AND proposed_cell = get_my_cell());

CREATE POLICY "rcr_gyjn_insert"
  ON role_change_requests FOR INSERT
  WITH CHECK(get_my_role() = 'GYJN' AND proposed_cell = get_my_cell());

CREATE POLICY "rcr_bjn_select"
  ON role_change_requests FOR SELECT
  USING (get_my_role() = 'BJN' AND proposed_ministry_id = get_my_ministry_id());

CREATE POLICY "rcr_bjn_insert"
  ON role_change_requests FOR INSERT
  WITH CHECK(get_my_role() = 'BJN' AND proposed_ministry_id = get_my_ministry_id());

-- Any member can see requests filed for themselves
CREATE POLICY "rcr_member_self_select"
  ON role_change_requests FOR SELECT
  USING (member_id = auth.uid());

-- =============================================================
-- VIEW FOR CULTURE ROLE
-- Culture users should query this view — it only exposes
-- id, name, and profile_image_url from members.
-- =============================================================

CREATE VIEW members_public AS
  SELECT id, name, profile_image_url FROM members;
