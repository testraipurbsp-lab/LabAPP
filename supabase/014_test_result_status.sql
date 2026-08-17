-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds per-test completion tracking (Pending / Completed) to individual
-- test line items, not just one status for the whole visit — matches the
-- legacy software's Completed/Pending split when a visit books several
-- tests and only some are done.
-- ============================================================================

alter table patient_tests add column if not exists result_status text default 'pending';