-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds storage for entered test result values (per patient) and the
-- pathologist/signatory details shown at the bottom of a printed report.
-- ============================================================================

-- Holds the entered test sections/rows for a patient's report, e.g.:
-- [
--   { "section": "Erythrocytes",
--     "rows": [ { "investigation": "Hemoglobin", "value": "13.9", "unit": "g/dL", "range": "13-17.5" } ],
--     "interpretation": "optional free-text paragraph shown under this section" }
-- ]
alter table patients add column if not exists report_data jsonb default '[]'::jsonb;

-- Shown as "Authorized Signatory" on the printed report footer.
alter table settings add column if not exists pathologist_name text default 'Dr. Dhananjay Prasad';
alter table settings add column if not exists pathologist_qualification text default 'MBBS, MD (Pathology)';
alter table settings add column if not exists pathologist_reg_no text;