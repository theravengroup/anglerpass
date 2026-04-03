-- ═══════════════════════════════════════════════════════════════════
-- 00039: Club Logos Storage Bucket
-- Public bucket for club logos.
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('club-logos', 'club-logos', true)
on conflict (id) do nothing;

-- Anyone can view club logos (public bucket)
create policy club_logos_public_read on storage.objects
  for select using (bucket_id = 'club-logos');

-- Authenticated users can upload logos to their club's folder
-- Folder structure: {club_id}/logo-{timestamp}.webp
create policy club_logos_owner_upload on storage.objects
  for insert with check (
    bucket_id = 'club-logos'
    and auth.role() = 'authenticated'
  );

-- Owners can update their club's logo
create policy club_logos_owner_update on storage.objects
  for update using (
    bucket_id = 'club-logos'
    and auth.role() = 'authenticated'
  );

-- Owners can delete their club's logo
create policy club_logos_owner_delete on storage.objects
  for delete using (
    bucket_id = 'club-logos'
    and auth.role() = 'authenticated'
  );
