-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds a Result Type to the tests catalog: 'parameter' (numeric value +
-- unit + normal range, e.g. Hemoglobin) or 'descriptive' (free-text
-- narrative findings, e.g. USG/imaging reports) — matches the legacy
-- software's Parameter vs Descriptive test split.
-- ============================================================================

alter table tests add column if not exists result_type text default 'parameter';