-- ═══════════════════════════════════════════════════════════════════
-- 00038: Profile Photos Storage Bucket
-- Public bucket for user profile photos (avatars).
-- ═══════════════════════════════════════════════════════════════════

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Anyone can view profile photos (public bucket)
create policy profile_photos_public_read on storage.objects
  for select using (bucket_id = 'profile-photos');

-- Authenticated users can upload their own profile photo
create policy profile_photos_owner_upload on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update (overwrite) their own profile photo
create policy profile_photos_owner_update on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own profile photo
create policy profile_photos_owner_delete on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
