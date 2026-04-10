"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";

import AssociatedClubsList from "./AssociatedClubsList";
import PendingInvitationsList from "./PendingInvitationsList";
import ClubInviteForm from "./ClubInviteForm";

interface Invitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
}

interface ClubAccess {
  id: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  clubs: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

interface ClubAssociationProps {
  propertyId: string | undefined;
  onEnsureSaved: () => Promise<string | null>;
  onInvitationSent?: () => void;
}

export default function ClubAssociation({
  propertyId,
  onEnsureSaved,
  onInvitationSent,
}: ClubAssociationProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [associations, setAssociations] = useState<ClubAccess[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    if (!propertyId) return;
    setLoading(true);
    try {
      const [invRes, assocRes] = await Promise.all([
        fetch(`/api/clubs/invite?property_id=${propertyId}`),
        fetch(`/api/properties/${propertyId}/clubs`),
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setInvitations(data.invitations ?? []);
      }

      if (assocRes.ok) {
        const data = await assocRes.json();
        setAssociations(data.associations ?? []);
      }
    } catch {
      // Silent fail on fetch
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const hasAssociationsOrInvitations =
    associations.length > 0 || invitations.length > 0;

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-river/10">
            <Users className="size-4 text-river" />
          </div>
          <div>
            <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
              Club Association
            </CardTitle>
            <p className="mt-1 text-xs text-text-light">
              Every property must be associated with at least one fly fishing
              club before it can be submitted for review. Clubs serve as the
              trust layer — vetting anglers who book access to your water.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <AssociatedClubsList associations={associations} />

        <PendingInvitationsList invitations={invitations} />

        {loading && !hasAssociationsOrInvitations && (
          <div className="flex items-center gap-2 text-sm text-text-light">
            <Loader2 className="size-4 animate-spin" />
            Loading club associations...
          </div>
        )}

        <ClubInviteForm
          propertyId={propertyId}
          hasExisting={hasAssociationsOrInvitations}
          onEnsureSaved={onEnsureSaved}
          onInvitationSent={onInvitationSent}
          onInvitationsRefreshed={setInvitations}
        />
      </CardContent>
    </Card>
  );
}
