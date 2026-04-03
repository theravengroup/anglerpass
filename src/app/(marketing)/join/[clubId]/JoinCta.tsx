"use client";

import Link from "next/link";

interface JoinCtaProps {
  clubId: string;
  clubName: string;
}

export default function JoinCta({ clubId, clubName }: JoinCtaProps) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-forest">
        Interested in joining {clubName}?
      </h2>
      <p className="text-sm text-text-secondary">
        AnglerPass is currently in Early Access. Join the waitlist and
        we&rsquo;ll notify you when account creation opens for {clubName} members.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/#waitlist"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-forest px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-forest-deep sm:w-auto"
        >
          Join the Waitlist
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
