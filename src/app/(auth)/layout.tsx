/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-offwhite)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5"
          style={{ textDecoration: 'none' }}
        >
          <img src="/images/anglerpass-noword-logo.svg" alt="" style={{ height: 36, width: 'auto' }} />
          <span
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-forest)" }}
          >
            AnglerPass
          </span>
        </Link>

        <div className="rounded-xl border border-[var(--color-parchment)] bg-white px-8 py-10 shadow-md shadow-black/5">
          {children}
        </div>
      </div>
    </div>
  );
}
