-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Lets a report be shared with a patient (who is NOT logged into the app)
-- via a link, without exposing any other patient's data.
--
-- IMPORTANT — why this isn't just an RLS policy:
-- A Row Level Security policy like `using (share_token is not null)` would
-- NOT restrict access to one row — an anonymous visitor could still run
-- `select * from patients` and get every patient with a token, because RLS
-- filters rows independently of whatever WHERE clause the client sends.
-- Instead, this uses a SECURITY DEFINER function: the only way in is
-- knowing the exact random token, and it returns just the fields the
-- printed report actually needs — never phone, price, payment status, or
-- internal remarks.
-- ============================================================================

-- A random, unguessable token per patient, separate from the real ID.
alter table patients add column if not exists share_token uuid default gen_random_uuid();
update patients set share_token = gen_random_uuid() where share_token is null;

create or replace function get_public_report(p_token uuid)
returns table (
  id uuid, name text, age int, gender text, doctor text, patient_code text,
  collection_date date, report_date date, test_name text, report_status text,
  report_data jsonb,
  lab_name text, lab_address text, lab_phone text, lab_email text,
  pathologist_name text, pathologist_qualification text, pathologist_reg_no text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.age, p.gender, p.doctor, p.patient_code,
    p.collection_date, p.report_date, p.test_name, p.report_status,
    p.report_data,
    s.lab_name, s.address as lab_address, s.phone as lab_phone, s.email as lab_email,
    s.pathologist_name, s.pathologist_qualification, s.pathologist_reg_no
  from patients p
  left join settings s on s.id = 1
  where p.share_token = p_token
  limit 1;
$$;

-- Anyone can CALL this function, but only ever gets back the one row whose
-- token they already know — there's no way to list or enumerate others.
grant execute on function get_public_report(uuid) to anon;