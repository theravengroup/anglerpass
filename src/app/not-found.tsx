import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-8 py-10">
      <div className="max-w-[480px] text-center">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2.5 no-underline"
        >
          <img
            src="/images/anglerpass-noword-logo.svg"
            alt=""
            className="h-9 w-auto opacity-70"
          />
          <span className="font-heading text-[22px] font-semibold tracking-[-0.3px] text-white">
            AnglerPass
          </span>
        </Link>

        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
          404
        </p>

        <h1 className="mb-4 font-heading text-[clamp(32px,4vw,48px)] font-medium leading-[1.15] tracking-[-0.5px] text-parchment">
          Water not found
        </h1>

        <p className="mb-10 text-[16px] leading-[1.7] text-parchment/50">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>

        <div className="flex flex-wrap justify-center gap-3.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-bronze px-7 py-3.5 text-[14px] font-medium tracking-[0.3px] text-white no-underline transition-all duration-[400ms]"
          >
            Back to Home
          </Link>
          <Link
            href="/#waitlist"
            className="inline-flex items-center gap-2 rounded-md border border-parchment/20 bg-transparent px-7 py-3.5 text-[14px] font-medium tracking-[0.3px] text-parchment no-underline transition-all duration-[400ms]"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </div>
  );
}
