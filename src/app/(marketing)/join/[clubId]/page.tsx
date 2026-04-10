import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import JoinCta from "./JoinCta";

async function getClub(clubId: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("clubs")
      .select(
        "id, name, description, location, initiation_fee, annual_dues, membership_application_required, corporate_memberships_enabled"
      )
      .eq("id", clubId)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Look up the referrer's display name by referral code.
 */
async function getReferrer(clubId: string, referralCode: string) {
  if (!referralCode) return null;
  try {
    const db = createAdminClient();
    const typedAdmin = createAdminClient();

    const { data: rows } = await db
      .from("club_memberships")
      .select("id, user_id")
      .eq("referral_code", referralCode)
      .eq("club_id", clubId)
      .eq("status", "active")
      .limit(1);

    const membership = (rows as { id: string; user_id: string }[] | null)?.[0];
    if (!membership) return null;

    const { data: profile } = await typedAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", membership.user_id)
      .single();

    return {
      name: profile?.display_name ?? "A member",
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: string }>;
}): Promise<Metadata> {
  const { clubId } = await params;
  const club = await getClub(clubId);

  if (!club) {
    return { title: "Club Not Found — AnglerPass" };
  }

  return {
    title: `Join ${club.name} — AnglerPass`,
    description:
      club.description ??
      `Join ${club.name} on AnglerPass and get access to private fly fishing water.`,
    openGraph: {
      title: `Join ${club.name} — AnglerPass`,
      description:
        club.description ??
        `Join ${club.name} on AnglerPass and get access to private fly fishing water.`,
    },
  };
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined || amount === 0) return "Set by club";
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function JoinClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { clubId } = await params;
  const { ref: referralCode } = await searchParams;
  const club = await getClub(clubId);
  const referrer = referralCode ? await getReferrer(clubId, referralCode) : null;

  if (!club) {
    return (
      <>
        <section className="bg-forest-deep py-40 text-center">
          <div className="mx-auto max-w-lg px-8">
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,42px)] font-medium text-parchment">
              Club Not Found
            </h1>
            <p className="mb-8 text-base leading-relaxed text-parchment/50">
              This join link doesn&rsquo;t match any club on AnglerPass. The
              link may have expired or the club may no longer be active.
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

  const initiationDisplay = formatCurrency(club.initiation_fee);
  const duesDisplay = formatCurrency(club.annual_dues);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pb-16 pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl px-8 text-center">
          <span className="mb-4 inline-block font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-bronze-light">
            Membership Invitation
          </span>
          <h1 className="mb-3 font-[family-name:var(--font-heading)] text-[clamp(32px,5vw,52px)] font-medium leading-tight text-parchment">
            {club.name}
          </h1>
          {club.location && (
            <p className="mb-4 text-sm text-parchment/50">{club.location}</p>
          )}
          <p className="text-lg leading-relaxed text-parchment/60">
            Join {club.name} on AnglerPass
          </p>
          {referrer && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-parchment/10 px-4 py-1.5 text-sm text-parchment/70">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-bronze-light"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Referred by {referrer.name}
            </p>
          )}
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
                <span className="text-sm font-medium text-text-primary">
                  {initiationDisplay}
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
              A 3.5% processing fee will be added at checkout to cover payment
              processing.
            </p>
          </div>

          {/* Join CTA */}
          <JoinCta clubId={club.id} clubName={club.name} referralCode={referralCode} />

          {/* Corporate membership link */}
          {club.corporate_memberships_enabled && (
            <div className="mt-8 text-center">
              <p className="text-sm text-text-secondary">
                Looking for a corporate membership?{" "}
                <Link
                  href={`/join/${club.id}/corporate`}
                  className="font-medium text-river underline transition-colors hover:text-river-dark"
                >
                  Learn about corporate access &rarr;
                </Link>
              </p>
            </div>
          )}

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
