-- Cross-Club Network: Open to all tiers with graduated agreement limits
-- Starter: up to 2 partner agreements
-- Standard: up to 10 partner agreements
-- Pro: unlimited partner agreements

-- Update eligibility function: all tiers are now eligible
create or replace function public.is_cross_club_eligible(p_club_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.clubs
    where id = p_club_id
      and subscription_tier in ('starter', 'standard', 'pro')
  );
$$;

comment on function public.is_cross_club_eligible is
  'Returns true if the club is on any paid tier (all tiers are eligible for cross-club agreements with graduated limits).';

-- Add agreement limit function based on tier
create or replace function public.cross_club_agreement_limit(p_club_id uuid)
returns integer
language sql
stable
security definer
as $$
  select case
    when subscription_tier = 'starter' then 2
    when subscription_tier = 'standard' then 10
    when subscription_tier = 'pro' then 2147483647 -- effectively unlimited
    else 0
  end
  from public.clubs
  where id = p_club_id;
$$;

comment on function public.cross_club_agreement_limit is
  'Returns the maximum number of cross-club agreements allowed for a club based on its subscription tier.';
