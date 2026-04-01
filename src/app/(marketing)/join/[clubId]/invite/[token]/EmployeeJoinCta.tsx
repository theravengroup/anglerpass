"use client";

import Link from "next/link";

interface EmployeeJoinCtaProps {
  clubId: string;
  clubName: string;
  token: string;
}

export default function EmployeeJoinCta({
  clubId,
  clubName,
  token,
}: EmployeeJoinCtaProps) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-forest">
        Ready to join {clubName}?
      </h2>
      <p className="text-sm text-text-secondary">
        Create your AnglerPass account to accept this corporate employee
        membership invitation. Already have an account? Sign in and we&rsquo;ll
        link you to this club.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/signup?role=angler&clubId=${clubId}&corpToken=${token}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-forest px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-forest-deep sm:w-auto"
          aria-label="Create account and join as corporate employee member"
        >
          Create Account &amp; Join
        </Link>
        <Link
          href={`/login?clubId=${clubId}&corpToken=${token}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-light/30 bg-white px-8 py-3.5 text-sm font-medium text-text-primary transition-colors hover:bg-offwhite sm:w-auto"
          aria-label="Sign in to accept corporate employee invitation"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
