-- SMS Consent (TCPA compliance)
-- Adds phone number and SMS consent tracking to profiles.

-- phone column may already exist from earlier ad-hoc work; add only if missing.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
  ) then
    alter table public.profiles add column phone text;
  end if;
end $$;

alter table public.profiles
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_ip text,
  add column if not exists sms_consent_text text,
  add column if not exists sms_consent_revoked_at timestamptz;
