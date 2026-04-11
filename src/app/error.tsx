'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-8 py-10">
      <div className="max-w-[480px] text-center">
        <a
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
        </a>

        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
          Something went wrong
        </p>

        <h1 className="mb-4 font-heading text-[clamp(32px,4vw,48px)] font-medium leading-[1.15] tracking-[-0.5px] text-parchment">
          Upstream conditions
        </h1>

        <p className="mb-10 text-[16px] leading-[1.7] text-parchment/50">
          We hit an unexpected snag. This has been noted and we&rsquo;re working on it.
        </p>

        <div className="flex flex-wrap justify-center gap-3.5">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-bronze px-7 py-3.5 text-[14px] font-medium tracking-[0.3px] text-white transition-all duration-[400ms]"
          >
            Try Again
          </button>
          <a
            href={isLoggedIn ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 rounded-md border border-parchment/20 bg-transparent px-7 py-3.5 text-[14px] font-medium tracking-[0.3px] text-parchment no-underline transition-all duration-[400ms]"
          >
            {isLoggedIn ? "Go to Dashboard" : "Back to Home"}
          </a>
        </div>
      </div>
    </div>
  );
}
