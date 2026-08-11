-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Fixes: changing your Display Name in Settings silently did nothing —
-- the profiles table had no UPDATE policy at all (by design, to stop a
-- staff account ever promoting itself to admin). This adds the missing
-- self-update policy, but adds a trigger that ignores any attempt to
-- change your OWN role no matter what value is sent — so a name change
-- works, while the original privilege-escalation protection stays intact.
-- ============================================================================

create policy "profiles update own row" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.role is distinct from OLD.role then
    -- Only someone who is ALREADY an admin may change a role (e.g. an
    -- admin editing a staff member's role via the dashboard/SQL editor).
    -- Anyone else's attempted role change is silently ignored, even if
    -- it was sent in the same request as a legitimate name update.
    if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
      NEW.role := OLD.role;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_profile_role_change on profiles;
create trigger guard_profile_role_change
  before update on profiles
  for each row execute function prevent_self_role_change();