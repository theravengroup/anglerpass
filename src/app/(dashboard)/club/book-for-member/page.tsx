import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authorize, P } from '@/lib/permissions';
import BookOnBehalf from '@/components/clubs/BookOnBehalf';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book for Member — AnglerPass',
};

export default async function BookForMemberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Find the user's club (as staff/owner)
  const { data: membership } = await admin
    .from('club_memberships')
    .select('club_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['admin', 'staff', 'owner', 'club_admin', 'booking_staff'])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Staff Access Required"
        description="This feature is available to club staff with booking permissions."
      />
    );
  }

  const clubId = membership.club_id;

  // Verify permission
  const authResult = await authorize({
    permission: P.BOOKING_CREATE_ON_BEHALF,
    userId: user.id,
    clubId,
  });

  if (!authResult.allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Permission Denied"
        description="Your club role does not include booking permissions. Contact your club owner."
      />
    );
  }

  // Fetch club members
  const { data: rawMembers } = await admin
    .from('club_memberships')
    .select('id, user_id, role, status')
    .eq('club_id', clubId)
    .eq('status', 'active');

  // Enrich with profiles and emails
  const memberIds = (rawMembers ?? []).filter((m) => m.user_id).map((m) => m.user_id as string);
  const { data: profiles } = memberIds.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', memberIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name ?? 'Unknown'])
  );

  // Get emails
  const emailMap = new Map<string, string>();
  for (const uid of memberIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap.set(uid, data.user.email);
    } catch {
      // skip
    }
  }

  const members = (rawMembers ?? [])
    .filter((m): m is typeof m & { user_id: string } => m.user_id != null && m.role === 'member')
    .map((m) => ({
      id: m.id,
      user_id: m.user_id,
      display_name: profileMap.get(m.user_id) ?? 'Unknown',
      email: emailMap.get(m.user_id) ?? '',
      status: m.status,
    }));

  // Fetch accessible properties
  const { data: accessRecords } = await admin
    .from('club_property_access')
    .select('property_id')
    .eq('club_id', clubId)
    .eq('status', 'approved');

  const propertyIds = (accessRecords ?? []).map((a) => a.property_id);

  const { data: properties } = propertyIds.length > 0
    ? await admin
        .from('properties')
        .select('id, name, location_description, rate_adult_full_day, rate_adult_half_day, half_day_allowed, max_rods')
        .in('id', propertyIds)
        .eq('status', 'published')
    : { data: [] };

  return (
    <BookOnBehalf
      clubId={clubId}
      members={members}
      properties={properties ?? []}
    />
  );
}
