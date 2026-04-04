import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ClubStaffManager from '@/components/clubs/ClubStaffManager';

export const metadata: Metadata = {
  title: 'Staff Management — AnglerPass',
};

export default async function ClubStaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Find club where user is owner or staff
  const { data: membership } = await admin
    .from('club_memberships')
    .select('club_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!membership) redirect('/club');

  // Check if user is the club owner
  const { data: club } = await admin
    .from('clubs')
    .select('owner_id')
    .eq('id', membership.club_id)
    .single();

  const isOwner = club?.owner_id === user.id;

  return (
    <div className="mx-auto max-w-5xl">
      <ClubStaffManager clubId={membership.club_id} isOwner={isOwner} />
    </div>
  );
}
