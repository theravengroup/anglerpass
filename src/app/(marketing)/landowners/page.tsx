import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'For Landowners',
  description:
    'Manage private water access professionally. Property registration, access controls, booking management, and more with AnglerPass.',
};

const features = [
  {
    title: 'Property Registration',
    description:
      'Create detailed, professional profiles for each property and water. Define boundaries, species, regulations, and seasonal details in one place.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: 'Access Controls',
    description:
      'Decide who sees your water, who can request access, and under what terms. Full control over visibility, guest limits, and seasonal windows.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Booking Management',
    description:
      'Accept, decline, or manage access requests with a clean dashboard. No more spreadsheets, phone tag, or handshake-only arrangements.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
      </svg>
    ),
  },
  {
    title: 'Availability Calendars',
    description:
      'Set open dates, block off private periods, and define rod limits per day. Anglers see only what you make available.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Professional Profiles',
    description:
      'Showcase your property with photos, maps, species lists, and access terms. First impressions that match the quality of your water.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Inquiry Handling',
    description:
      'Receive and respond to access inquiries through a structured system. Track conversations, set response templates, and never lose a lead.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
];

export default function LandownersPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(58,107,124,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze-light">
            For Landowners
          </span>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-parchment sm:text-5xl lg:text-6xl">
            Your Water. Your Rules.
            <br />
            Your Platform.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-parchment/70">
            Manage private water access with the professionalism your property
            deserves. AnglerPass gives landowners the tools to control, organize,
            and monetize access on their own terms.
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
              What You Get
            </span>
            <h2 className="font-heading text-3xl font-semibold text-forest sm:text-4xl">
              Everything a landowner needs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              Purpose-built tools for managing private water access, designed
              with input from landowners across the American West.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-parchment bg-white shadow-none transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-forest/5 text-forest">
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

      {/* Why AnglerPass */}
      <section className="bg-parchment-light py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="mb-3 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze">
            Why AnglerPass
          </span>
          <h2 className="font-heading text-3xl font-semibold text-forest sm:text-4xl">
            Your property deserves better than a spreadsheet
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-text-secondary leading-relaxed">
            Most private water access is still managed through phone calls,
            handshakes, and scattered notes. AnglerPass replaces that with a
            platform built specifically for landowners who take their water
            seriously.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-3xl font-semibold text-parchment sm:text-4xl">
            Ready to modernize access to your water?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-parchment/60">
            Join the waitlist and be among the first landowners to use AnglerPass
            when we launch.
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
