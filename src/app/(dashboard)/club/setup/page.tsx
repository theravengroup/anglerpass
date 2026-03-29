"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import ClubProfileForm from "@/components/clubs/ClubProfileForm";

export default function ClubSetupPage() {
  return (
    <Suspense>
      <ClubSetupContent />
    </Suspense>
  );
}

function ClubSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitation");

  const [invitationData, setInvitationData] = useState<{
    club_name: string;
    property_name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(!!invitationToken);
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  // Check if user already has a club
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/clubs");
        if (res.ok) {
          const data = await res.json();
          if (data.owned?.length > 0) {
            setHasClub(true);
            // Redirect to club dashboard
            router.push("/club");
            return;
          }
        }
        setHasClub(false);
      } catch {
        setHasClub(false);
      }
    }
    check();
  }, [router]);

  // If there's an invitation token, fetch the invitation details
  useEffect(() => {
    if (!invitationToken) return;

    async function fetchInvitation() {
      try {
        const res = await fetch(
          `/api/clubs/invitation-details?token=${invitationToken}`
        );
        if (res.ok) {
          const data = await res.json();
          setInvitationData(data);
        }
      } catch {
        // Continue without pre-fill
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [invitationToken]);

  if (hasClub === null || loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (hasClub) {
    return null; // Redirecting
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-river/10">
          <Users className="size-6 text-river" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Set Up Your Club
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Create your club profile on AnglerPass. Once set up, you can invite
            members, manage property associations, and coordinate access to
            private water.
          </p>
        </div>
      </div>

      {invitationData && (
        <Card className="border-river/20 bg-river/5">
          <CardContent className="py-4">
            <p className="text-sm text-river">
              <strong>{invitationData.club_name}</strong> was invited by a
              landowner
              {invitationData.property_name && (
                <>
                  {" "}
                  to associate with{" "}
                  <strong>{invitationData.property_name}</strong>
                </>
              )}
              . Setting up your club will automatically link this property.
            </p>
          </CardContent>
        </Card>
      )}

      <ClubProfileForm
        mode="create"
        initialData={
          invitationData ? { name: invitationData.club_name } : undefined
        }
        invitationToken={invitationToken}
        onSuccess={() => {
          router.push("/club");
          router.refresh();
        }}
      />
    </div>
  );
}
