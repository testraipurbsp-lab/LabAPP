-- ============================================================================
-- Run this ONCE in Supabase → SQL Editor.
-- Creates a storage bucket for the lab logo. Public read (so the logo shows
-- on the printed report and public share links without login), admin-only
-- write (matches the existing admin-only rule on the settings table itself).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('lab-assets', 'lab-assets', true)
on conflict (id) do nothing;

create policy "lab-assets public read" on storage.objects
  for select using (bucket_id = 'lab-assets');

create policy "lab-assets admin insert" on storage.objects
  for insert with check (
    bucket_id = 'lab-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "lab-assets admin update" on storage.objects
  for update using (
    bucket_id = 'lab-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "lab-assets admin delete" on storage.objects
  for delete using (
    bucket_id = 'lab-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );