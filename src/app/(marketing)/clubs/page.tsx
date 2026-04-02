import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, DollarSign, Users } from 'lucide-react';
import ClubFaqSection from '@/components/clubs/ClubFaqSection';

export const metadata: Metadata = {
  title: 'For Clubs — AnglerPass',
  description:
    'Run your fishing club with modern tools. Membership management, scheduling, roster tools, and reservation coordination with AnglerPass.',
  openGraph: {
    title: 'For Clubs — AnglerPass',
    description:
      'Run your fishing club with modern tools. Membership management, scheduling, and reservation coordination.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Clubs — AnglerPass',
    description:
      'Run your fishing club with modern tools. Membership management, scheduling, and reservation coordination.',
  },
};

const features = [
  {
    title: 'Membership Management',
    description:
      'Track active members, dues status, membership tiers, and renewal dates. A single source of truth for your entire roster.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Access Scheduling',
    description:
      'Coordinate who fishes where and when. Assign beats, manage rotation schedules, and prevent double-booking across your waters.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Digital Rosters',
    description:
      'Maintain member directories with contact details, access history, and preferences. Searchable, sortable, and always current.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    title: 'Reservation Coordination',
    description:
      'Let members request and reserve fishing days through a structured system. Automated confirmations, waitlists, and cancellation handling.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
      </svg>
    ),
  },
  {
    title: 'Member Communication',
    description:
      'Send announcements, event notices, and updates to your membership. Targeted messaging by tier, activity, or custom groups.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: 'Guest & Event Management',
    description:
      'Handle guest passes, tournament days, and special events within the same platform. Track guest history and set club policies.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
];

export default function ClubsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="audience-hero-badge inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            For Clubs
          </span>
          <h1 className="audience-hero-heading font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Run Your Club<br />Like It Deserves.
          </h1>
          <p className="audience-hero-sub text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto mb-10">
            Clubs are the trust layer of AnglerPass. You vet your members,
            landowners trust your judgment, and everyone gets access to better water.
            Modern tools for clubs that take their operations seriously.
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
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              Club Operations
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium text-forest mb-4 tracking-[-0.3px] text-balance">
              Modern tools for serious clubs
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Replace binders, email chains, and bulletin boards with a platform
              built specifically for fly fishing club management.
            </p>
          </div>

          <div className="marketing-features-grid grid grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`reveal d${(i % 3) + 1} bg-white border border-parchment rounded-[14px] px-7 py-9 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]`}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-river/8 flex items-center justify-center mb-5 text-river">
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

      {/* Pricing tiers */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[1000px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              Club Pricing
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium text-forest mb-4 tracking-[-0.3px] text-balance">
              Simple plans that grow with your club
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Your subscription covers the platform. You set your own initiation fees
              and annual dues &mdash; we just add a 3.5% processing fee at checkout,
              paid by the member, to cover payment processing. Your club receives 100%
              of your stated fees.
            </p>
          </div>
          <div className="marketing-features-grid grid grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '$149',
                description: 'For new or small clubs getting organized.',
                features: ['Up to 500 members', 'Up to 25 properties', 'Basic scheduling', 'Member roster', 'Email support'],
                highlight: false,
              },
              {
                name: 'Standard',
                price: '$349',
                description: 'For established clubs managing active rosters.',
                features: ['Up to 2,000 members', 'Up to 100 properties', 'Advanced scheduling & rotation', 'Cross-club access eligible', 'Member communication tools', 'Priority support'],
                highlight: true,
              },
              {
                name: 'Pro',
                price: '$699',
                description: 'For large clubs with complex operations.',
                features: ['Unlimited members', 'Unlimited properties', 'Cross-club access eligible', 'Guest pass system', 'Analytics & reporting', 'Dedicated support'],
                highlight: false,
              },
            ].map((tier, i) => (
              <div
                key={tier.name}
                className={`reveal d${i + 1} bg-white ${tier.highlight ? 'border-2 border-river' : 'border border-parchment'} rounded-[14px] px-7 py-9 relative`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-river text-white text-[11px] font-semibold tracking-[0.1em] uppercase px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-[22px] font-semibold text-forest mb-1 tracking-[-0.2px]">
                  {tier.name}
                </h3>
                <div className="mb-3">
                  <span className="font-heading text-[36px] font-semibold text-forest">
                    {tier.price}
                  </span>
                  <span className="text-sm text-text-light">/month</span>
                </div>
                <p className="text-sm leading-[1.6] text-text-secondary mb-5">
                  {tier.description}
                </p>
                <ul className="list-none m-0 p-0">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 py-1.5 text-[13.5px] text-text-secondary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-river)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center max-w-[600px] mx-auto mt-8">
            <p className="text-[13px] text-text-light italic mb-3">
              All plans include a 30-day free trial. No credit card required to start.
              <br />
              Need more properties? Additional properties available at tiered pricing.
            </p>
            <div className="bg-river/6 border border-river/12 rounded-[10px] px-6 py-5 mt-5">
              <p className="text-[13.5px] text-text-secondary leading-[1.7] m-0">
                <strong className="text-forest">Membership payments:</strong> You set your
                initiation fees and annual dues. When members pay, we add a 3.5% processing fee at
                checkout to cover credit card processing &mdash; paid by the member, not by your club.
                Your club receives 100% of your stated fees. See our{' '}
                <Link href="/pricing" className="text-river underline">
                  pricing page
                </Link>{' '}
                for full details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate memberships */}
      <section id="corporate" className="py-[100px] bg-offwhite">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="reveal text-center mb-[72px]">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              Grow Your Club
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium text-forest mb-4 tracking-[-0.3px] text-balance">
              Grow Your Club With Corporate Memberships
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Give local businesses a reason to invest in your club. Corporate
              memberships let companies pay an initiation fee and invite their
              employees to join &mdash; expanding your roster and deepening
              community ties.
            </p>
          </div>

          <div className="marketing-features-grid grid grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: 'Unlimited Employee Access',
                description:
                  'Corporate members can invite their entire team. Each employee pays only annual dues \u2014 no initiation fee.',
              },
              {
                icon: DollarSign,
                title: 'You Set the Price',
                description:
                  'Configure your own corporate initiation fee. AnglerPass handles invitations, onboarding, and payment collection.',
              },
              {
                icon: Users,
                title: 'Deeper Community Ties',
                description:
                  'Build relationships with local businesses. Corporate memberships create lasting partnerships between companies and your club.',
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`reveal d${i + 1} bg-white border border-parchment rounded-[14px] px-7 py-9 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]`}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-river/8 flex items-center justify-center mb-5 text-river">
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-[20px] font-semibold text-forest mb-2.5 tracking-[-0.2px]">
                  {card.title}
                </h3>
                <p className="text-[14.5px] leading-[1.7] text-text-secondary m-0">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-club access */}
      <section className="py-[100px] bg-parchment-light">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
            Cross-Club Network
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium text-forest mb-5 tracking-[-0.3px] text-balance">
            Expand your members&rsquo; access without expanding your lease
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto">
            Standard and Pro clubs can opt in to cross-club access &mdash; letting
            your members book fishing days on water managed by other clubs in the
            AnglerPass network, and vice versa. More value for your members, more
            reach for your club, and new revenue from reciprocal bookings.
          </p>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-20 bg-offwhite">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            The Trust Layer
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium text-forest mb-5 tracking-[-0.3px] text-balance">
            Clubs make private water access work
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto">
            Landowners don&rsquo;t want strangers on their property. They want vetted,
            responsible anglers &mdash; and your club is the one doing the vetting.
            AnglerPass makes your club the gateway to private water, giving your
            membership real, tangible value.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <ClubFaqSection />

      {/* CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium text-parchment mb-4 tracking-[-0.3px] text-balance">
            Bring your club into the modern era
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-10 leading-[1.7]">
            Join the waitlist and be among the first clubs to use AnglerPass when
            we launch.
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
