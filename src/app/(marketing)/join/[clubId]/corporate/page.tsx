import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import CorporateJoinCta from "./CorporateJoinCta";

async function getClub(clubId: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("clubs")
      .select(
        "id, name, description, location, initiation_fee, annual_dues, corporate_memberships_enabled, corporate_initiation_fee, membership_application_required, stripe_dues_price_id"
      )
      .eq("id", clubId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
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
    title: `Corporate Membership — ${club.name} — AnglerPass`,
    description: `Join ${club.name} with a corporate membership on AnglerPass. Includes your own angler access plus unlimited employee invitations.`,
    openGraph: {
      title: `Corporate Membership — ${club.name} — AnglerPass`,
      description: `Join ${club.name} with a corporate membership on AnglerPass. Includes your own angler access plus unlimited employee invitations.`,
    },
  };
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined || amount === 0)
    return "Set by club";
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function CorporateJoinPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = await getClub(clubId);

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

  if (!club.corporate_memberships_enabled) {
    return (
      <>
        <section className="bg-forest-deep py-40 text-center">
          <div className="mx-auto max-w-lg px-8">
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,42px)] font-medium text-parchment">
              Corporate Memberships Not Available
            </h1>
            <p className="mb-8 text-base leading-relaxed text-parchment/50">
              {club.name} does not currently offer corporate memberships. You
              can still join as an individual member.
            </p>
            <Link
              href={`/join/${club.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-bronze px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-bronze-light"
            >
              View Individual Membership
            </Link>
          </div>
        </section>
      </>
    );
  }

  const corporateFeeDisplay = formatCurrency(club.corporate_initiation_fee);
  const duesDisplay = formatCurrency(club.annual_dues);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pb-16 pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl px-8 text-center">
          <span className="mb-4 inline-block font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-bronze-light">
            Corporate Membership
          </span>
          <h1 className="mb-3 font-[family-name:var(--font-heading)] text-[clamp(32px,5vw,52px)] font-medium leading-tight text-parchment">
            {club.name}
          </h1>
          {club.location && (
            <p className="mb-4 text-sm text-parchment/50">{club.location}</p>
          )}
          <p className="text-lg leading-relaxed text-parchment/60">
            Corporate access to {club.name} on AnglerPass
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

          {/* Corporate value proposition */}
          <div className="mb-10 rounded-xl border border-bronze/20 bg-bronze/5 p-6">
            <h2 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-forest">
              What&rsquo;s Included
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Your corporate membership includes your own angler access plus the
              ability to invite unlimited employees. Each employee pays only the
              annual dues &mdash; no initiation fee.
            </p>
          </div>

          {/* Fee breakdown */}
          <div className="mb-10 rounded-xl border border-stone-light/20 bg-white p-6">
            <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-forest">
              Fee Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-light/15 pb-3">
                <span className="text-sm text-text-secondary">
                  Corporate Initiation Fee
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {corporateFeeDisplay}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-light/15 pb-3">
                <span className="text-sm text-text-secondary">
                  Annual Dues
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {duesDisplay !== "Set by club"
                    ? `${duesDisplay}/year`
                    : duesDisplay}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Employee Initiation Fee
                </span>
                <span className="text-sm font-medium text-forest">Waived</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-text-light">
              A 5% AnglerPass platform fee will be added at checkout. Employees
              you invite will only pay the annual dues.
            </p>
          </div>

          {/* Corporate Join CTA */}
          <CorporateJoinCta
            clubId={club.id}
            clubName={club.name}
            corporateInitiationFee={club.corporate_initiation_fee}
            annualDues={club.annual_dues}
            duesPriceId={club.stripe_dues_price_id ?? null}
          />

          {/* Footer note */}
          <div className="mt-10 space-y-3 text-center">
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
            <p className="text-xs text-text-light">
              Looking for an individual membership instead?{" "}
              <Link
                href={`/join/${club.id}`}
                className="font-medium text-river underline"
              >
                Join as an individual
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
