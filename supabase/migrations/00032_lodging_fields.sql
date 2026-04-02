-- Add lodging availability fields to properties
alter table public.properties
  add column if not exists lodging_available boolean not null default false,
  add column if not exists lodging_url text;

comment on column public.properties.lodging_available is
  'Whether the property has lodging available via a third-party platform (Airbnb/VRBO).';
comment on column public.properties.lodging_url is
  'URL to the Airbnb or VRBO listing. Only relevant when lodging_available is true.';
