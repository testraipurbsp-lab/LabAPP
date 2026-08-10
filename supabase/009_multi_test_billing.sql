-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Adds itemized multi-test billing to a patient visit (matching the old
-- desktop software's Test Booking screen: several tests per visit, each
-- with its own rate, summed into one bill), plus Home Collection Charges
-- and a Corporate billing flag.
--
-- patients.price / discount / final_amount keep their existing names but
-- now mean the VISIT TOTAL (sum of all test lines), not a single test's
-- price — this keeps Payments, Pending Payments, CSV export, etc. working
-- without further changes, since they already just read those columns.
-- patients.test_name becomes a comma-joined summary (e.g. "CBC, Glucose
-- (F)") for display in lists/reports; the real itemized detail lives in
-- the new patient_tests table.
-- ============================================================================

create table if not exists patient_tests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  test_id uuid references tests(id) on delete set null,
  test_name text not null,
  category text,
  rate numeric default 0,
  qty numeric default 1,
  created_at timestamptz default now()
);

alter table patient_tests enable row level security;
create policy "patient_tests full access" on patient_tests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table patients add column if not exists home_collection_charge numeric default 0;
alter table patients add column if not exists corporate boolean default false;