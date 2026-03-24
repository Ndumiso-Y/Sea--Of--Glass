-- =============================================================
-- 005_member_rls.sql
-- Grants members self-service write access for daily bread,
-- evangelism prospect visibility, and catchup attendance
-- self-reporting.
-- =============================================================

-- ── 1. Unique constraint on daily_bread so upsert works cleanly ───────────────
ALTER TABLE daily_bread
  ADD CONSTRAINT daily_bread_member_date_unique UNIQUE (member_id, date);

-- ── 2. Daily bread: member can mark their own records as watched ──────────────
CREATE POLICY "daily_bread_member_insert"
  ON daily_bread FOR INSERT
  WITH CHECK (member_id = get_my_member_id());

CREATE POLICY "daily_bread_member_update"
  ON daily_bread FOR UPDATE
  USING     (member_id = get_my_member_id())
  WITH CHECK(member_id = get_my_member_id());

-- ── 3. Evangelism: member can see prospects they are responsible for ──────────
CREATE POLICY "ep_member_self"
  ON evangelism_prospects FOR SELECT
  USING (linked_member_id = get_my_member_id());

-- ── 4. Attendance: member can self-report catchup / online attendance ─────────
-- Leaders still own physical and formal attendance marking;
-- members may only record catchup/online types for themselves.
CREATE POLICY "attendance_member_self_report"
  ON attendance FOR INSERT
  WITH CHECK (
    member_id = get_my_member_id() AND
    attendance_type IN (
      'catchup_spiritual', 'catchup_online', 'catchup_friendship',
      'catchup_full', 'catchup_bb', 'online'
    )
  );
