-- =============================================================
-- 006_telegram_chats.sql
-- Telegram integration: chat mapping table, announcement scope
-- columns, updated RLS, and realtime publication.
-- =============================================================

-- ── 1. telegram_chats table ───────────────────────────────────────────────────
CREATE TABLE telegram_chats (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     bigint      UNIQUE NOT NULL,
  chat_title  text,
  chat_type   text,
  scope       text        DEFAULT 'church_wide',  -- church_wide | department | cell
  department  text,
  cell        text,
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE telegram_chats ENABLE ROW LEVEL SECURITY;

-- GSN/SMN: full read + write
CREATE POLICY "tg_chats_gsn_smn"
  ON telegram_chats FOR ALL
  USING     (get_my_role() IN ('GSN', 'SMN'))
  WITH CHECK(get_my_role() IN ('GSN', 'SMN'));

-- All other authenticated roles: read chats matching their department or cell,
-- plus all church_wide chats.
CREATE POLICY "tg_chats_others_select"
  ON telegram_chats FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    get_my_role() NOT IN ('GSN', 'SMN') AND
    (
      scope = 'church_wide' OR
      (scope = 'department' AND department = get_my_department()) OR
      (scope = 'cell'       AND cell       = get_my_cell())
    )
  );

-- ── 2. Add scope / department / cell columns to announcements ─────────────────
ALTER TABLE announcements
  ADD COLUMN scope      text DEFAULT 'church_wide',
  ADD COLUMN department text,
  ADD COLUMN cell       text;

-- ── 3. Update announcements_select_scoped to handle cell-level targeting ──────
DROP POLICY "announcements_select_scoped" ON announcements;

CREATE POLICY "announcements_select_scoped"
  ON announcements FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    get_my_role() NOT IN ('GSN', 'SMN') AND
    (
      recipient_group = 'all'                OR
      scope           = 'church_wide'        OR
      (scope = 'department' AND department = get_my_department()) OR
      (scope = 'cell'       AND cell       = get_my_cell())       OR
      -- backward-compat: old rows with no scope column set
      recipient_group = get_my_department()  OR
      recipient_group = get_my_cell()
    )
  );

-- ── 4. Enable realtime on relevant tables ─────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE announcement_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE telegram_chats;
