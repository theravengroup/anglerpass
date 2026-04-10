import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EmployeeJoinCta from "./EmployeeJoinCta";

// ─── Data fetchers ──────────────────────────────────────────────────

async function getInvitation(token: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("corporate_invitations")
      .select(
        "id, email, status, token, club_id, corporate_member_id, invited_at, accepted_at"
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

async function getClub(clubId: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("clubs")
      .select("id, name, description, location, annual_dues, stripe_dues_price_id")
      .eq("id", clubId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

async function getCorporateMember(
  membershipId: string
): Promise<{ company_name: string | null; sponsor_name: string | null } | null> {
  try {
    const admin = createAdminClient();
    const { data: membership, error } = await admin
      .from("club_memberships")
      .select("company_name, user_id")
      .eq("id", membershipId)
      .maybeSingle();

    if (error || !membership) return null;

    let sponsorName: string | null = null;
    if (membership.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", membership.user_id)
        .maybeSingle();

      sponsorName = profile?.display_name ?? null;

      if (!sponsorName) {
        const { data: authUser } = await admin.auth.admin.getUserById(
          membership.user_id
        );
        sponsorName = authUser?.user?.email ?? null;
      }
    }

    return {
      company_name: membership.company_name,
      sponsor_name: sponsorName,
    };
  } catch {
    return null;
  }
}

// ─── Metadata ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: string; token: string }>;
}): Promise<Metadata> {
  const { clubId, token } = await params;
  const invitation = await getInvitation(token);

  if (!invitation) {
    return { title: "Invalid Invitation — AnglerPass" };
  }

  const club = await getClub(clubId);
  const clubName = club?.name ?? "Club";

  return {
    title: `Join ${clubName} — Corporate Employee Membership — AnglerPass`,
    description: `Accept your corporate employee invitation to join ${clubName} on AnglerPass.`,
  };
}

// ─── Page ───────────────────────────────────────────────────────────

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined || amount === 0)
    return "Set by club";
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function EmployeeInvitePage({
  params,
}: {
  params: Promise<{ clubId: string; token: string }>;
}) {
  const { clubId, token } = await params;
  const invitation = await getInvitation(token);

  // Invalid or not found
  if (!invitation) {
    return (
      <>
        <section className="bg-forest-deep py-40 text-center">
          <div className="mx-auto max-w-lg px-8">
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,42px)] font-medium text-parchment">
              Invalid Invitation
            </h1>
            <p className="mb-8 text-base leading-relaxed text-parchment/50">
              This invitation link is no longer valid. It may have expired or
              already been used. Please contact your corporate sponsor for a new
              invitation.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-bronze px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-bronze-light"
            >
              Go to AnglerPass
            </Link>
          </div>
        </section>
      </>
    );
  }

  // Already accepted
  if (invitation.status === "accepted") {
    return (
      <>
        <section className="bg-forest-deep py-40 text-center">
          <div className="mx-auto max-w-lg px-8">
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,42px)] font-medium text-parchment">
              Invitation Already Accepted
            </h1>
            <p className="mb-8 text-base leading-relaxed text-parchment/50">
              This invitation has already been accepted. If you already have an
              account, sign in to access your membership.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-bronze px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-bronze-light"
            >
              Sign In
            </Link>
          </div>
        </section>
      </>
    );
  }

  // Expired
  if (invitation.status === "expired") {
    return (
      <>
        <section className="bg-forest-deep py-40 text-center">
          <div className="mx-auto max-w-lg px-8">
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,42px)] font-medium text-parchment">
              Invitation Expired
            </h1>
            <p className="mb-8 text-base leading-relaxed text-parchment/50">
              This invitation has expired. Please contact your corporate sponsor
              to request a new one.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-bronze px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-bronze-light"
            >
              Go to AnglerPass
            </Link>
          </div>
        </section>
      </>
    );
  }

  // Verify club matches
  if (invitation.club_id !== clubId) {
    return notFound();
  }

  // Fetch club and corporate member info
  const [club, corporateMember] = await Promise.all([
    getClub(clubId),
    getCorporateMember(invitation.corporate_member_id),
  ]);

  if (!club) {
    return notFound();
  }

  const duesDisplay = formatCurrency(club.annual_dues);
  const companyName = corporateMember?.company_name ?? "your company";
  const sponsorName = corporateMember?.sponsor_name ?? "your corporate sponsor";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pb-16 pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl px-8 text-center">
          <span className="mb-4 inline-block font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-bronze-light">
            Corporate Employee Membership
          </span>
          <h1 className="mb-3 font-[family-name:var(--font-heading)] text-[clamp(32px,5vw,52px)] font-medium leading-tight text-parchment">
            {club.name}
          </h1>
          {club.location && (
            <p className="mb-4 text-sm text-parchment/50">{club.location}</p>
          )}
          <p className="text-lg leading-relaxed text-parchment/60">
            You have been invited to join {club.name} through {companyName}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-offwhite py-16">
        <div className="mx-auto max-w-2xl px-8">
          {/* Club description */}
          {club.description && (
            <div className="mb-10">
              <p className="text-base leading-relaxed text-text-secondary">
                {club.description}
              </p>
            </div>
          )}

          {/* Corporate sponsor info */}
          <div className="mb-10 rounded-xl border border-river/20 bg-river/5 p-6">
            <h2 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-river">
              Corporate Membership
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Company</span>
                <span className="text-sm font-medium text-text-primary">
                  {companyName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Sponsored by
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {sponsorName}
                </span>
              </div>
            </div>
          </div>

          {/* Membership fees */}
          <div className="mb-10 rounded-xl border border-stone-light/20 bg-white p-6">
            <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-forest">
              Membership Fees
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-light/15 pb-3">
                <span className="text-sm text-text-secondary">
                  Initiation Fee
                </span>
                <span className="text-sm font-medium text-forest">
                  Covered by {companyName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Annual Dues
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {duesDisplay !== "Set by club"
                    ? `${duesDisplay}/year`
                    : duesDisplay}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-text-light">
              Your initiation fee has been covered by {companyName}&rsquo;s
              corporate membership. You are only responsible for the annual dues.
              A 3.5% processing fee will be added at checkout.
            </p>
          </div>

          {/* Join CTA */}
          <EmployeeJoinCta
            clubId={clubId}
            clubName={club.name}
            token={token}
            annualDues={club.annual_dues}
            duesPriceId={club.stripe_dues_price_id ?? null}
          />

          {/* Footer note */}
          <div className="mt-10 text-center">
            <p className="text-xs text-text-light">
              By joining, you agree to the club&rsquo;s rules and the{" "}
              <Link
                href="/policies"
                className="font-medium text-river underline"
              >
                AnglerPass platform policies
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
