-- Fix: change property_review_stats from SECURITY DEFINER to SECURITY INVOKER
-- so the view respects the caller's RLS policies instead of running as the owner.

alter view public.property_review_stats set (security_invoker = on);
