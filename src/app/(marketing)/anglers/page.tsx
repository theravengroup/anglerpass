import type { Metadata } from 'next';
import Link from 'next/link';
import AudienceFaqAccordion from '@/components/shared/AudienceFaqAccordion';
import DashboardPreviewSection from '@/components/shared/DashboardPreviewSection';
import { PAGES_SEO, buildJsonLd } from '@/lib/seo';

export const metadata: Metadata = PAGES_SEO.anglers;

const features = [
  {
    title: 'Discover Private Waters',
    description:
      'Browse private fly fishing properties available through your club. Filter by location, species, season, and access type to find water worth traveling for.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: 'Book Through Your Club',
    description:
      'Request access and book fishing days through your club membership. Clear pricing, availability, and terms before you commit.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    title: 'Vetted Access',
    description:
      'Every angler on AnglerPass is vouched for by their club. Landowners trust the platform because clubs vet their members — creating access opportunities that wouldn\u2019t exist otherwise.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Availability',
    description:
      'See what is open, when, and for how many rods. No guessing, no unanswered emails, no waiting weeks for a callback.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Angler Profile',
    description:
      'Build your fishing resume. Track properties visited, species caught, and build a reputation that opens doors to premium waters.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: 'Trip Planning',
    description:
      'Save properties, compare options, and plan multi-day trips across different waters. Everything organized in one place.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
];

const anglerFaqJsonLd = buildJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I join AnglerPass as an angler?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Find a participating fly fishing club near you on AnglerPass and apply for membership. Each club sets its own membership requirements, initiation fees, and annual dues.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of private water are available on AnglerPass?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AnglerPass properties include private trout streams, spring creeks, rivers, ranch ponds, and stillwater lakes across the United States, all managed by member fly fishing clubs.',
      },
    },
    {
      '@type': 'Question',
      name: "Can I fish properties managed by clubs I'm not a member of?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. AnglerPass enables cross-club access, meaning a member of any club on the network can book properties managed by other participating clubs, subject to availability and host club rules.',
      },
    },
  ],
});

export default function AnglersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: anglerFaqJsonLd }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="audience-hero-badge inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            For Anglers
          </span>
          <h1 className="audience-hero-heading font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Find the Water<br />Worth Finding.
          </h1>
          <p className="audience-hero-sub text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto mb-10">
            Access private waters through trusted fly fishing clubs. AnglerPass
            connects serious anglers with exceptional properties through a
            club-based platform built on vetting, trust, and respect for the resource.
          </p>
          <div className="audience-hero-ctas flex gap-3.5 justify-center flex-wrap">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-[34px] py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              Join the Waitlist &rarr;
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-[34px] py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-transparent text-parchment border border-parchment/20 transition-all duration-[400ms]"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-[120px] bg-offwhite">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="reveal text-center mb-[72px]">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              The Angler Experience
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Access water worth the trip
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Join a club, get vetted, and unlock access to private waters that
              were previously available only through personal connections.
            </p>
          </div>

          <div className="marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`reveal d${(i % 3) + 1} bg-white border border-parchment rounded-[14px] px-7 py-9 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]`}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-bronze/8 flex items-center justify-center mb-5 text-bronze">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-[20px] font-semibold text-forest mb-2.5 tracking-[-0.2px]">
                  {feature.title}
                </h3>
                <p className="text-[14.5px] leading-[1.7] text-text-secondary m-0">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Club membership trust section */}
      <section className="py-[100px] bg-parchment-light">
        <div className="reveal max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            How It Works
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            Access starts with your club
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[620px] mx-auto mb-12">
            AnglerPass is not a free-for-all booking site. Every angler accesses private
            water through a fly fishing club that vouches for its members. Clubs are the
            trust layer that makes landowners comfortable opening their gates.
          </p>
          <div className="marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6 text-left">
            {[
              { step: '01', title: 'Join a Club', text: 'Find a fly fishing club on AnglerPass and apply for membership. Clubs set their own standards and vet every applicant.' },
              { step: '02', title: 'Get Vetted', text: 'Your club reviews your application and vouches for you as a responsible angler. This vetting is what earns landowner trust.' },
              { step: '03', title: 'Book Water', text: 'Once you\u2019re a club member, browse properties your club has access to and book fishing days through the platform.' },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`reveal d${i + 1} bg-white border border-parchment rounded-[14px] px-6 py-8`}
              >
                <span className="inline-block font-mono text-[11px] font-semibold text-bronze tracking-[0.15em] mb-3">
                  STEP {item.step}
                </span>
                <h3 className="font-heading text-[20px] font-semibold text-forest mb-2.5 tracking-[-0.2px]">
                  {item.title}
                </h3>
                <p className="text-[14.5px] leading-[1.7] text-text-secondary m-0">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking fees section */}
      <section className="py-20 bg-offwhite">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            Transparent Pricing
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            Simple, fair booking fees
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto mb-8">
            When you book a fishing day through AnglerPass, a 15% platform fee is
            added to the property&rsquo;s base rate. This fee covers the booking platform,
            payment processing, and the trust infrastructure that makes private water
            access possible. Here&rsquo;s how a typical booking breaks down:
          </p>
          <div className="bg-white border border-parchment rounded-[14px] px-8 py-7 max-w-[480px] mx-auto text-left">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-light mb-4">
              Example booking
            </p>
            <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-parchment">
              <span className="text-sm text-text-secondary">Rod fee (set by landowner)</span>
              <span className="text-sm font-semibold text-forest">$125</span>
            </div>
            <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-parchment">
              <span className="text-sm text-text-secondary">Platform fee (15%)</span>
              <span className="text-sm font-semibold text-bronze">$18.75</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-forest">You pay</span>
              <span className="text-[16px] font-bold text-forest">$143.75</span>
            </div>
          </div>
          <p className="text-[13px] text-text-light mt-4 italic">
            No hidden fees. No subscription required for anglers. You only pay when you book.
          </p>
        </div>
      </section>

      {/* Cross-club access section */}
      <section className="py-[100px] bg-parchment-light">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            The Network Effect
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            One membership, expanding access
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto">
            Clubs on AnglerPass can opt in to cross-club access agreements, meaning
            your membership in one club can unlock fishing days on water managed by
            other clubs in the network. The more clubs that join, the more water
            becomes available to you &mdash; without needing multiple memberships.
          </p>
        </div>
      </section>

      {/* Find water in your state */}
      <section className="py-20 bg-offwhite">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal text-center mb-10">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              By State
            </span>
            <h2 className="font-heading text-[clamp(24px,3vw,34px)] font-medium leading-[1.15] text-forest mb-3 tracking-[-0.3px]">
              Find private water in your state
            </h2>
            <p className="text-[15px] text-text-secondary max-w-[480px] mx-auto">
              AnglerPass connects anglers with private fly fishing water across
              the country.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { name: 'Montana', slug: 'montana' },
              { name: 'Colorado', slug: 'colorado' },
              { name: 'Wyoming', slug: 'wyoming' },
              { name: 'Idaho', slug: 'idaho' },
              { name: 'Oregon', slug: 'oregon' },
              { name: 'Washington', slug: 'washington' },
              { name: 'Virginia', slug: 'virginia' },
              { name: 'Pennsylvania', slug: 'pennsylvania' },
              { name: 'North Carolina', slug: 'north-carolina' },
              { name: 'Tennessee', slug: 'tennessee' },
              { name: 'Utah', slug: 'utah' },
              { name: 'New York', slug: 'new-york' },
            ].map((s) => (
              <Link
                key={s.slug}
                href={`/explore?state=${encodeURIComponent(s.name)}`}
                className="bg-white border border-parchment rounded-lg px-4 py-3 text-center text-[14px] font-medium text-forest no-underline hover:border-bronze/30 hover:bg-bronze/5 transition-all"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate access callout */}
      <section className="py-20 bg-parchment-light">
        <div className="reveal max-w-[700px] mx-auto px-8">
          <div className="bg-bronze/5 border border-bronze/15 rounded-xl px-8 py-10 text-center">
            <h3 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
              Corporate Access Available
            </h3>
            <p className="text-[15px] leading-[1.65] text-text-secondary m-0">
              Does your company offer a corporate membership? Ask your employer
              about corporate membership through AnglerPass &mdash; you could
              join a club with no initiation fee.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <DashboardPreviewSection role="angler" />

      {/* FAQ */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[700px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              FAQ
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              Common questions
            </h2>
          </div>

          <AudienceFaqAccordion
            faqs={[
              {
                q: 'Do I need to be a member of a club to use AnglerPass?',
                a: 'Yes. AnglerPass is a club-based platform. You must be an active member of at least one fly fishing club on the platform to browse properties and book fishing days. This club vetting is what earns landowner trust and makes private water access possible.',
              },
              {
                q: 'How much does it cost to book a fishing day?',
                a: 'The rod fee is set by each landowner and varies by property. A 15% platform fee is added on top of the rod fee at checkout. There is no subscription or membership fee charged by AnglerPass itself \u2014 you only pay when you book.',
              },
              {
                q: 'How do I find and join a club?',
                a: 'You can browse clubs on AnglerPass and apply directly through the platform. Each club sets its own membership criteria, initiation fees, and annual dues. Some clubs accept all applicants, while others have a vetting or interview process.',
              },
              {
                q: 'What kind of water is available on AnglerPass?',
                a: 'Private rivers, spring creeks, ponds, and lakes that are not accessible to the general public. Properties range from intimate spring creeks to multi-mile stretches of premium trout water on working ranches. All water on the platform is fly fishing only.',
              },
              {
                q: 'Can I book a guide for my trip?',
                a: 'Yes, but it is entirely optional. When booking a fishing day, you can choose to add a verified guide to your trip. Guides set their own rates, and a 10% service fee is added on top, paid by you. Many anglers fish without a guide.',
              },
              {
                q: 'Can I book multi-day trips?',
                a: 'Yes. You can select a date range when booking and reserve consecutive days on the same property. The fee breakdown shows the per-day rate multiplied by the number of days so you know exactly what you are paying before you confirm.',
              },
              {
                q: 'What is cross-club access?',
                a: 'Some clubs on AnglerPass opt in to reciprocal access agreements with other clubs. If your club has a cross-club agreement, you may be able to book water managed by partner clubs without needing a separate membership. This expands your options as the network grows.',
              },
              {
                q: 'What is the cancellation policy?',
                a: 'Cancellation terms vary by property and are shown before you confirm your booking. Generally, cancellations made well in advance receive a full refund, while last-minute cancellations may be subject to partial or no refund to protect landowners and guides.',
              },
              {
                q: 'What does my employer\u2019s corporate membership get me?',
                a: 'If your company holds a corporate membership with a club on AnglerPass, you can join that club as a corporate employee member \u2014 typically with no initiation fee. You get the same access to properties and booking capabilities as any other club member.',
              },
              {
                q: 'Is there lodging available near the properties?',
                a: 'Some properties offer lodging through platforms like Airbnb or VRBO. When lodging is available, you will see a lodging indicator on the property listing with a direct link to the accommodation. This makes it easy to plan multi-day trips to remote waters.',
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
            Your next best day on the water starts here
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-10 leading-[1.7]">
            Join the waitlist and be among the first anglers to access
            exceptional private waters through club-vetted booking on AnglerPass.
          </p>
          <Link
            href="/#waitlist"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
          >
            Join the Waitlist
          </Link>
        </div>
      </section>
    </>
  );
}
