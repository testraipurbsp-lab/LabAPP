-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor, before the Patients module goes live.
-- Adds a friendly, auto-numbered Patient ID (e.g. PT0001, PT0002, ...) that
-- the database generates by itself — the app never has to compute it, so it
-- can't collide even if two staff add a patient at the same moment.
-- The real primary key (patients.id) stays a UUID underneath, unchanged.
-- ============================================================================

create sequence if not exists patient_code_seq;

alter table patients add column if not exists patient_code text;

alter table patients
  alter column patient_code set default ('PT' || lpad(nextval('patient_code_seq')::text, 4, '0'));

-- Backfill any existing rows that don't have one yet
update patients set patient_code = 'PT' || lpad(nextval('patient_code_seq')::text, 4, '0')
  where patient_code is null;

alter table patients add constraint patients_patient_code_key unique (patient_code);
