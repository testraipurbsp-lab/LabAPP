-- ============================================================================
-- VITALS LAB — Supabase schema
-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run.
-- Mirrors the exact data model already used by the app (patients, doctors,
-- areas, tests, payments, pending_payments, expenses, settings), plus a
-- `profiles` table that stores each user's role (admin/staff) alongside
-- Supabase's own built-in `auth.users` table.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES — one row per login, linked 1:1 to Supabase Auth's auth.users.
--    Supabase Auth handles the actual username/password/session; this table
--    just stores the extra info the app needs (display name + role).
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin','staff')),
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 2. CORE LAB TABLES
-- ----------------------------------------------------------------------------
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  pincode text,
  collection_charge numeric default 0,
  status text default 'Active',
  created_at timestamptz default now()
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialization text,
  hospital text,
  clinic text,
  phone text,
  email text,
  address text,
  commission numeric default 0,
  status text default 'Active',
  notes text,
  created_at timestamptz default now()
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  sample_type text,
  normal_range text,
  price numeric default 0,
  report_time text,
  status text default 'Active',
  created_at timestamptz default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  guardian_name text,
  gender text,
  dob date,
  age int,
  phone text,
  alt_phone text,
  email text,
  address text,
  city text,
  area text,
  doctor text,
  blood_group text,
  height numeric,
  weight numeric,
  emergency_contact text,
  reference text,
  test_category text,
  test_name text,
  sample_type text,
  collection_date date,
  report_date date,
  price numeric default 0,
  discount numeric default 0,
  final_amount numeric default 0,
  payment_status text default 'pending',
  payment_method text,
  report_status text default 'collected',
  remarks text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete set null,
  patient text not null,
  doctor text,
  area text,
  amount numeric default 0,
  discount numeric default 0,
  final_amount numeric default 0,
  method text,
  status text default 'pending',
  date date default current_date,
  created_at timestamptz default now()
);

create table if not exists pending_payments (
  id uuid primary key default gen_random_uuid(),
  patient text not null,
  doctor text,
  phone text,
  area text,
  amount numeric default 0,
  due_date date,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  vendor text,
  invoice_number text,
  amount numeric default 0,
  payment_mode text,
  date date default current_date,
  description text,
  attachment_url text,
  created_at timestamptz default now()
);

-- Single-row settings table (lab profile). id is always 1.
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  lab_name text default 'Vitals Lab',
  phone text,
  email text,
  address text,
  gst text,
  logo_url text,
  updated_at timestamptz default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--    Every table is locked down by default; policies below explicitly allow
--    what's needed. Expenses (and settings writes) are admin-only — enforced
--    here in the database, not just hidden in the UI, so a staff account
--    can never read/write them even by calling the API directly.
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table areas enable row level security;
alter table doctors enable row level security;
alter table tests enable row level security;
alter table patients enable row level security;
alter table payments enable row level security;
alter table pending_payments enable row level security;
alter table expenses enable row level security;
alter table settings enable row level security;

-- Helper: is the current logged-in user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- profiles: everyone can read all profiles (needed to show staff names);
-- nobody can write from the client — role changes happen via Supabase
-- dashboard only, to prevent a staff account ever promoting itself to admin.
create policy "profiles read (any logged-in user)" on profiles
  for select using (auth.role() = 'authenticated');

-- Shared lab data: any logged-in user (admin or staff) can read/write.
create policy "areas full access" on areas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "doctors full access" on doctors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "tests full access" on tests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "patients full access" on patients for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "payments full access" on payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "pending_payments full access" on pending_payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Settings: anyone logged in can read; only admins can change lab profile.
create policy "settings read (any logged-in user)" on settings
  for select using (auth.role() = 'authenticated');
create policy "settings update (admin only)" on settings
  for update using (is_admin()) with check (is_admin());

-- Expenses: admin only, full stop — enforced at the database level.
create policy "expenses admin only" on expenses
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- 4. HOW TO CREATE LOGINS (do this after running this schema)
-- ----------------------------------------------------------------------------
-- This app doesn't have public self-signup — an admin creates each account:
--   1. Supabase Dashboard → Authentication → Users → Add user
--      (set their email + a password)
--   2. Copy the new user's UID from that screen
--   3. Run this, filling in the UID, name, and role ('admin' or 'staff'):
--
--      insert into profiles (id, name, role)
--      values ('', 'Dr. Ashok Verma', 'admin');
--
-- Repeat per staff member. The app's login screen will then authenticate
-- against real Supabase accounts instead of the old demo localStorage users.