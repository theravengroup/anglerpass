import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'For Clubs',
  description:
    'Run your fishing club with modern tools. Membership management, scheduling, roster tools, and reservation coordination with AnglerPass.',
};

const features = [
  {
    title: 'Membership Management',
    description:
      'Track active members, dues status, membership tiers, and renewal dates. A single source of truth for your entire roster.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Access Scheduling',
    description:
      'Coordinate who fishes where and when. Assign beats, manage rotation schedules, and prevent double-booking across your waters.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Digital Rosters',
    description:
      'Maintain member directories with contact details, access history, and preferences. Searchable, sortable, and always current.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    title: 'Reservation Coordination',
    description:
      'Let members request and reserve fishing days through a structured system. Automated confirmations, waitlists, and cancellation handling.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
      </svg>
    ),
  },
  {
    title: 'Member Communication',
    description:
      'Send announcements, event notices, and updates to your membership. Targeted messaging by tier, activity, or custom groups.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: 'Guest & Event Management',
    description:
      'Handle guest passes, tournament days, and special events within the same platform. Track guest history and set club policies.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
];

export default function ClubsPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze-light">
            For Clubs
          </span>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-parchment sm:text-5xl lg:text-6xl">
            Run Your Club
            <br />
            Like It Deserves.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-parchment/70">
            Membership rosters, scheduling, reservations, and communication
            tools designed for fly fishing clubs that take their operations
            seriously.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/#waitlist">
              <Button className="rounded-full bg-bronze px-8 py-5 text-base font-medium text-white hover:bg-bronze-light">
                Join the Waitlist
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="rounded-full border-parchment/20 px-8 py-5 text-base font-medium text-parchment hover:bg-parchment/10"
              >
                Talk to Us
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
              Club Operations
            </span>
            <h2 className="font-heading text-3xl font-semibold text-forest sm:text-4xl">
              Modern tools for serious clubs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              Replace binders, email chains, and bulletin boards with a platform
              built specifically for fly fishing club management.
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

      {/* Testimonial / value prop */}
      <section className="bg-parchment-light py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="mb-3 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze">
            Built for Clubs
          </span>
          <h2 className="font-heading text-3xl font-semibold text-forest sm:text-4xl">
            Your members deserve a better experience
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-text-secondary leading-relaxed">
            The best clubs run on clear communication, fair scheduling, and
            organized operations. AnglerPass gives your board and members the
            tools to make that effortless.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-3xl font-semibold text-parchment sm:text-4xl">
            Bring your club into the modern era
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-parchment/60">
            Join the waitlist and be among the first clubs to use AnglerPass when
            we launch.
          </p>
          <div className="mt-10">
            <Link href="/#waitlist">
              <Button className="rounded-full bg-bronze px-10 py-5 text-base font-medium text-white hover:bg-bronze-light">
                Join the Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
