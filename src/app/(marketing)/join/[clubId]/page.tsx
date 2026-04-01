import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import JoinCta from "./JoinCta";

interface ClubPublicData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  initiation_fee: number | null;
  annual_dues: number | null;
  membership_application_required: boolean;
}

async function getClub(clubId: string): Promise<ClubPublicData | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("clubs")
      .select(
        "id, name, description, location, initiation_fee, annual_dues, membership_application_required"
      )
      .eq("id", clubId)
      .single();

    if (error || !data) return null;
    return data as unknown as ClubPublicData;
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

  const initiationDisplay = formatCurrency(club.initiation_fee);
  const duesDisplay = formatCurrency(club.annual_dues);
  // TODO: initiation_fee and annual_dues exist in DB (migration 00022) but may not be
  // in the generated Supabase TypeScript types yet. The query works via admin client
  // and the values are cast through `as unknown as ClubPublicData`.

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

          {/* Stripe payment placeholder */}
          <div className="mb-10 rounded-xl border-2 border-dashed border-stone-light/30 bg-parchment-light/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-light">
              Membership Payment &mdash; Stripe integration coming soon
            </p>
            {/* STRIPE PAYMENT INTEGRATION — add Stripe Elements here */}
          </div>

          {/* Join CTA */}
          <JoinCta clubId={club.id} clubName={club.name} />

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
