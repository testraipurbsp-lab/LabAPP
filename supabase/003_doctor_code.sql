-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor, before the Doctors module goes live.
-- Same idea as 002_patient_code.sql: adds a friendly, DB-generated code
-- (e.g. DR0001) for display, while the real primary key stays a UUID.
-- ============================================================================

create sequence if not exists doctor_code_seq;

alter table doctors add column if not exists doctor_code text;

alter table doctors
  alter column doctor_code set default ('DR' || lpad(nextval('doctor_code_seq')::text, 4, '0'));

update doctors set doctor_code = 'DR' || lpad(nextval('doctor_code_seq')::text, 4, '0')
  where doctor_code is null;

alter table doctors add constraint doctors_doctor_code_key unique (doctor_code);
