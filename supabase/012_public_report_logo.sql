-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds lab_logo_url to the public report function (008_public_report_share.sql)
-- so shared WhatsApp/Email report links show the real lab logo, not just the
-- staff-authenticated view.
--
-- Postgres won't let CREATE OR REPLACE change a function's return columns,
-- so the old version has to be dropped first.
-- ============================================================================

drop function if exists get_public_report(uuid);

create function get_public_report(p_token uuid)
returns table (
  id uuid, name text, age int, gender text, doctor text, patient_code text,
  collection_date date, report_date date, test_name text, report_status text,
  report_data jsonb,
  lab_name text, lab_address text, lab_phone text, lab_email text, lab_logo_url text,
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
    s.logo_url as lab_logo_url,
    s.pathologist_name, s.pathologist_qualification, s.pathologist_reg_no
  from patients p
  left join settings s on s.id = 1
  where p.share_token = p_token
  limit 1;
$$;

grant execute on function get_public_report(uuid) to anon;