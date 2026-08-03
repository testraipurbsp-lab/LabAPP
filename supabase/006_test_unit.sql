-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds a Unit field to the tests catalog (e.g. "g/dL", "mg/dL", "%"), so
-- units can be picked consistently instead of retyped every time a report
-- result is entered.
-- ============================================================================

alter table tests add column if not exists unit text;