'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/**
 * A CTA link that swaps its destination and label based on auth state.
 * - Unauthenticated: shows the waitlist/signup CTA (default)
 * - Authenticated: shows "Go to Dashboard" instead
 *
 * Renders server-safe (shows the default/unauth state on initial render
 * to avoid hydration mismatch, then swaps client-side if logged in).
 */
export default function AuthAwareCta({
  href,
  children,
  className,
  dashboardLabel = "Go to Dashboard",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  dashboardLabel?: string;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  if (isLoggedIn) {
    return (
      <Link href="/dashboard" className={className}>
        {dashboardLabel}
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
