import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'For Anglers',
  description:
    'Discover private waters, book experiences, and access trusted properties. AnglerPass connects serious anglers with exceptional water.',
};

const features = [
  {
    title: 'Discover Private Waters',
    description:
      'Browse a curated directory of private fly fishing properties. Filter by location, species, season, and access type to find water worth traveling for.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: 'Book Experiences',
    description:
      'Request access and book fishing days directly through the platform. Clear pricing, availability, and terms before you commit.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    title: 'Trusted Properties',
    description:
      'Every listing on AnglerPass is managed by a verified landowner or club. Quality standards, clear expectations, and real accountability.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Availability',
    description:
      'See what is open, when, and for how many rods. No guessing, no unanswered emails, no waiting weeks for a callback.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Angler Profile',
    description:
      'Build your fishing resume. Track properties visited, species caught, and build a reputation that opens doors to premium waters.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: 'Trip Planning',
    description:
      'Save properties, compare options, and plan multi-day trips across different waters. Everything organized in one place.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
];

export default function AnglersPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(58,107,124,0.2),transparent_65%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-river-light">
            For Anglers
          </span>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-parchment sm:text-5xl lg:text-6xl">
            Find the Water
            <br />
            Worth Finding.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-parchment/70">
            Access private waters you never knew existed. AnglerPass connects
            serious anglers with exceptional properties through a platform built
            on trust, transparency, and respect for the resource.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/#waitlist">
              <Button className="rounded-full bg-river px-8 py-5 text-base font-medium text-white hover:bg-river-light">
                Join the Waitlist
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="rounded-full border-parchment/20 px-8 py-5 text-base font-medium text-parchment hover:bg-parchment/10"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-offwhite py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block font-mono text-xs uppercase tracking-[0.2em] text-river">
              The Angler Experience
            </span>
            <h2 className="font-heading text-3xl font-semibold text-forest sm:text-4xl">
              Access water worth the trip
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              AnglerPass opens doors to private waters that were previously
              accessible only through personal connections or years of networking.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-parchment bg-white shadow-none transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-river/10 text-river">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-forest">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="bg-parchment-light py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="mb-3 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze">
            The AnglerPass Difference
          </span>
          <h2 className="font-heading text-3xl font-semibold text-forest sm:text-4xl">
            Not another booking site
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-text-secondary leading-relaxed">
            AnglerPass is built around respect for private water and the people
            who steward it. Every interaction is designed to build trust between
            anglers and landowners, creating access opportunities that benefit
            everyone involved.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-3xl font-semibold text-parchment sm:text-4xl">
            Your next best day on the water starts here
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-parchment/60">
            Join the waitlist and be among the first anglers to discover
            exceptional private waters through AnglerPass.
          </p>
          <div className="mt-10">
            <Link href="/#waitlist">
              <Button className="rounded-full bg-river px-10 py-5 text-base font-medium text-white hover:bg-river-light">
                Join the Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
