-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds real two-level authentication for reports, matching the legacy
-- software's "Authentication Level 1" / "Authentication Level 2":
--   Level 1 (Verify)  — technician confirms the entered results are correct
--   Level 2 (Approve) — pathologist/admin gives final sign-off
-- Both are recorded with who did it and when, for a proper audit trail —
-- not just a status dropdown anyone can jump straight to "Report Ready" on.
-- ============================================================================

alter table patients add column if not exists verified_by text;
alter table patients add column if not exists verified_at timestamptz;
alter table patients add column if not exists approved_by text;
alter table patients add column if not exists approved_at timestamptz;