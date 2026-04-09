"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
        <AlertTriangle className="size-7 text-bronze" />
      </div>
      <h2 className="mt-5 font-heading text-xl font-semibold text-text-primary">
        Admin Error
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Something went wrong loading this admin page. The error has been
        logged automatically.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline" size="sm">
          Try Again
        </Button>
        <Link href="/admin">
          <Button size="sm">Back to Admin</Button>
        </Link>
      </div>
    </div>
  );
}
