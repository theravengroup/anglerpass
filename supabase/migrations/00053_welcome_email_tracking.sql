-- Track welcome email sequence progress per user.
-- 0 = no welcome emails sent, 1/2/3 = last email step sent.

alter table profiles
  add column if not exists welcome_email_step smallint not null default 0;

comment on column profiles.welcome_email_step
  is 'Welcome email sequence step (0=none, 1/2/3=last sent)';
