"use client";

import Link from "next/link";

interface CorporateJoinCtaProps {
  clubId: string;
  clubName: string;
}

export default function CorporateJoinCta({
  clubId,
  clubName,
}: CorporateJoinCtaProps) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-forest">
        Ready to join {clubName} as a corporate member?
      </h2>
      <p className="text-sm text-text-secondary">
        Create your AnglerPass account to apply for a corporate membership.
        Already have an account? Sign in and we&rsquo;ll link you to this club.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/signup?role=angler&clubId=${clubId}&membership=corporate`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-forest px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-forest-deep sm:w-auto"
        >
          Create Account &amp; Join as Corporate Member
        </Link>
        <Link
          href={`/login?clubId=${clubId}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-light/30 bg-white px-8 py-3.5 text-sm font-medium text-text-primary transition-colors hover:bg-offwhite sm:w-auto"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
