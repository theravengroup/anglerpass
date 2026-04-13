import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  DollarSign,
  Users,
  Megaphone,
  Filter,
  FileText,
  Clock,
  Newspaper,
  UsersRound,
  Settings,
  BarChart3,
  CalendarCheck,
  Activity,
  Download,
  ShieldCheck,
  ListOrdered,
  CalendarRange,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import ClubFaqSection from '@/components/clubs/ClubFaqSection';
import DashboardPreviewSection from '@/components/shared/DashboardPreviewSection';
import { PAGES_SEO, buildJsonLd } from '@/lib/seo';

export const metadata: Metadata = PAGES_SEO.clubs;

const clubOsComms = [
  {
    title: 'Club Broadcasts',
    description:
      'Send announcements to every member at once. One click, full\u00a0reach.',
    icon: <Megaphone size={22} />,
  },
  {
    title: 'Targeted Messaging',
    description:
      'Filter by membership tier, status, activity level, or renewal state. Send the right message to the right\u00a0members.',
    icon: <Filter size={22} />,
  },
  {
    title: 'Event & Season Templates',
    description:
      'Pre-built templates for tournaments, season openers, closures, and annual meetings. Customize and\u00a0send.',
    icon: <FileText size={22} />,
  },
  {
    title: 'Scheduled Sends',
    description:
      'Write it now, send it later. Set announcements on a schedule and move\u00a0on.',
    icon: <Clock size={22} />,
  },
  {
    title: 'Newsletter Digest',
    description:
      'Auto-generated recurring digest that summarizes club activity, upcoming events, and recent\u00a0bookings.',
    icon: <Newspaper size={22} />,
  },
  {
    title: 'Custom Groups',
    description:
      'Create member groups for committees, property teams, or any segment you\u00a0need.',
    icon: <UsersRound size={22} />,
  },
  {
    title: 'Communication Preferences',
    description:
      'Members control what they receive. Built-in CAN-SPAM\u00a0compliance.',
    icon: <Settings size={22} />,
  },
  {
    title: 'Analytics Dashboard',
    description:
      'Open rates, bounce tracking, delivery history. Know what lands and what\u00a0doesn\u2019t.',
    icon: <BarChart3 size={22} />,
  },
];

const clubOsOps = [
  {
    title: 'Membership & Roster',
    description:
      'Track active members, dues status, and renewal dates. Searchable directories with contact details, access history, and\u00a0preferences.',
    icon: <ClipboardList size={22} />,
  },
  {
    title: 'Access Scheduling',
    description:
      'Coordinate who fishes where and when. Assign beats, manage rotation schedules, and prevent double-booking across your\u00a0waters.',
    icon: <CalendarRange size={22} />,
  },
  {
    title: 'Event Management',
    description:
      'Tournaments, outings, work days. RSVPs, waitlists, reminders, and calendar\u00a0sync.',
    icon: <CalendarCheck size={22} />,
  },
  {
    title: 'Waitlist Management',
    description:
      'Property-level and membership-level waitlists with automated notifications when spots\u00a0open.',
    icon: <ListOrdered size={22} />,
  },
  {
    title: 'Incident Reporting',
    description:
      'Log safety issues, property damage, and rule violations. Track resolution with severity levels and\u00a0timelines.',
    icon: <AlertTriangle size={22} />,
  },
  {
    title: 'Member Activity Dashboard',
    description:
      'See who\u2019s active, who\u2019s dormant, and who\u2019s at risk of lapsing. Real engagement metrics, not just login\u00a0counts.',
    icon: <Activity size={22} />,
  },
  {
    title: 'Data Exports',
    description:
      'Export members, financials, and bookings as CSV or print-ready PDF. Your data, your\u00a0way.',
    icon: <Download size={22} />,
  },
  {
    title: 'Tier Limit Enforcement',
    description:
      'Automatic caps on members and properties based on your plan. Upgrade prompts when you\u2019re ready to\u00a0grow.',
    icon: <ShieldCheck size={22} />,
  },
];

const clubFaqJsonLd = buildJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does AnglerPass offer fly fishing clubs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AnglerPass gives clubs a full management platform including online membership enrollment, dues and initiation fee collection, corporate membership programs, private water property listings, and booking calendars.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AnglerPass pricing work for clubs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Clubs pay a flat monthly SaaS fee based on membership size. AnglerPass earns a small percentage on bookings. Clubs keep control of their membership fees and property rates.',
      },
    },
    {
      '@type': 'Question',
      name: "Can clubs use AnglerPass even if they don't own land?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Clubs can manage leased or landowner-permitted properties. AnglerPass facilitates the access and booking layer; clubs handle the landowner relationship.',
      },
    },
  ],
});

export default function ClubsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: clubFaqJsonLd }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <img
          src="/images/clubs-hero.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-forest-deep/70" />
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

      {/* ClubOS */}
      <section id="features" className="py-[120px] bg-offwhite relative">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="reveal text-center mb-[72px]">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              ClubOS
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              The Operating System Your Club Has Been&nbsp;Missing
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[620px] mx-auto leading-[1.65]">
              Every club plan includes ClubOS &mdash; 16 tools that replace binders,
              email chains, and bulletin boards with a real command center for communications,
              operations, and member&nbsp;intelligence.
            </p>
          </div>

          {/* Communications */}
          <div className="mb-16">
            <h3 className="reveal font-heading text-[24px] font-semibold text-forest mb-8 tracking-[-0.2px]">
              Communications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {clubOsComms.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`reveal d${(i % 4) + 1} bg-white border border-parchment rounded-[14px] px-7 py-8 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-river/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-[3px]`}
                >
                  <div className="w-[44px] h-[44px] rounded-[10px] bg-river/8 flex items-center justify-center mb-5 text-river">
                    {feature.icon}
                  </div>
                  <h4 className="font-heading text-[18px] font-semibold text-forest mb-2 tracking-[-0.2px]">
                    {feature.title}
                  </h4>
                  <p className="text-[14px] leading-[1.7] text-text-secondary m-0">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Operations */}
          <div className="mb-16">
            <h3 className="reveal font-heading text-[24px] font-semibold text-forest mb-8 tracking-[-0.2px]">
              Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {clubOsOps.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`reveal d${(i % 4) + 1} bg-white border border-parchment rounded-[14px] px-7 py-8 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-river/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-[3px]`}
                >
                  <div className="w-[44px] h-[44px] rounded-[10px] bg-river/8 flex items-center justify-center mb-5 text-river">
                    {feature.icon}
                  </div>
                  <h4 className="font-heading text-[18px] font-semibold text-forest mb-2 tracking-[-0.2px]">
                    {feature.title}
                  </h4>
                  <p className="text-[14px] leading-[1.7] text-text-secondary m-0">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="reveal text-center">
            <p className="text-[14.5px] text-text-light italic mb-6">
              ClubOS is included with every club plan. No add-ons, no upgrades&nbsp;required.
            </p>
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 rounded-[6px] bg-river px-8 py-4 text-[14px] font-medium text-white tracking-[0.3px] transition-all duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] hover:bg-river-light hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(58,107,124,0.3)]"
            >
              Join the Waitlist &rarr;
            </a>
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
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Simple plans that grow with your club
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Your subscription covers the platform. You set your own initiation fees
              and annual dues &mdash; we add a 5% AnglerPass platform fee at checkout,
              paid by the member. Your club receives 100% of your stated fees.
            </p>
          </div>
          <div className="marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '$79',
                futurePrice: '$129',
                description: 'For new or small clubs getting started.',
                features: ['Up to 100 members', 'Up to 10 properties', 'Member vetting & roster', 'Booking management', 'Cross-club network (2 partners)', 'Email support'],
                highlight: false,
              },
              {
                name: 'Standard',
                price: '$199',
                futurePrice: '$299',
                description: 'For established clubs managing active rosters.',
                features: ['Up to 500 members', 'Up to 50 properties', 'Cross-club network (10 partners)', 'Advanced scheduling & rotation', 'Financial reporting', 'Priority support'],
                highlight: true,
              },
              {
                name: 'Pro',
                price: '$499',
                futurePrice: '$699',
                description: 'For large clubs with complex operations.',
                features: ['Unlimited members', 'Unlimited properties', 'Cross-club network (unlimited)', 'Multi-rod group bookings', 'Analytics & reporting', 'Dedicated account manager'],
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
                <span className="inline-block mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-river font-semibold">
                  Early Access
                </span>
                <h3 className="font-heading text-[22px] font-semibold text-forest mb-1 tracking-[-0.2px]">
                  {tier.name}
                </h3>
                <div className="mb-1">
                  <span className="font-heading text-[36px] font-semibold text-forest">
                    {tier.price}
                  </span>
                  <span className="text-sm text-text-light">/month</span>
                </div>
                <p className="text-[12px] text-text-light mb-3">
                  <span className="line-through">{tier.futurePrice}/mo</span>{' '}after Oct&nbsp;1,&nbsp;2026
                </p>
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
            <p className="text-[13px] text-text-light italic mb-1">
              Early Access pricing is locked through September&nbsp;30,&nbsp;2026 for founding clubs.
            </p>
            <p className="text-[13px] text-text-light italic mb-3">
              All plans include a 30-day free trial. No credit card required to start.
              <br />
              Need more properties? Additional properties available at tiered pricing.
            </p>
            <div className="bg-river/6 border border-river/12 rounded-[10px] px-6 py-5 mt-5">
              <p className="text-[13.5px] text-text-secondary leading-[1.7] m-0">
                <strong className="text-forest">Membership payments:</strong>{' '}You set your
                initiation fees and annual dues. When members pay, we add a 5% AnglerPass platform
                fee at checkout &mdash; paid by the member, not by your club. Your club receives 100%
                of your stated fees. See our{' '}
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
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Grow Your Club With Corporate Memberships
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Give local businesses a reason to invest in your club. Corporate
              memberships let companies pay an initiation fee and invite their
              employees to join &mdash; expanding your roster and deepening
              community ties.
            </p>
          </div>

          <div className="marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6">
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

      {/* Interstitial image */}
      <div className="relative w-full h-[400px] overflow-hidden">
        <img
          src="/images/clubs-interstitial.webp"
          alt="Fly fishing club members on private water"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Cross-club network */}
      <section id="cross-club" className="py-[120px] bg-forest-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(154,115,64,0.08),transparent_60%)]" />
        <div className="relative max-w-[1200px] mx-auto px-8">
          {/* Header */}
          <div className="reveal text-center mb-[72px]">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
              Network Effect
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-5 tracking-[-0.3px] text-balance">
              The Cross-Club Network
            </h2>
            <p className="text-[16.5px] leading-[1.7] text-parchment/60 max-w-[600px] mx-auto">
              One membership. An expanding network of private water. Clubs on AnglerPass
              opt in to reciprocal access agreements &mdash; your members fish water managed
              by partner clubs, and theirs fish yours. The network grows with every club
              that joins.
            </p>
          </div>

          {/* How it works steps */}
          <div className="reveal mb-16">
            <h3 className="font-heading text-[22px] font-semibold text-parchment text-center mb-10 tracking-[-0.2px]">
              How It Works
            </h3>
            <div className="grid grid-cols-4 gap-5">
              {[
                {
                  step: '1',
                  title: 'Opt In',
                  description: 'Your club enables cross-club access in settings. You choose which properties to share with the network.',
                },
                {
                  step: '2',
                  title: 'Partner Up',
                  description: 'Browse other clubs in the network and propose reciprocal agreements. Both clubs must approve before access opens.',
                },
                {
                  step: '3',
                  title: 'Members Book',
                  description: 'Your members can now browse and book fishing days on partner club water, right from their dashboard.',
                },
                {
                  step: '4',
                  title: 'Everyone Benefits',
                  description: 'Your club earns a $5 referral credit on every cross-club rod your members book. Partner clubs earn the same from theirs.',
                },
              ].map((item, i) => (
                <div
                  key={item.step}
                  className={`reveal d${i + 1} relative bg-parchment/6 border border-parchment/12 rounded-[14px] px-6 py-8`}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bronze/20 text-bronze text-[13px] font-semibold mb-4">
                    {item.step}
                  </span>
                  <h4 className="font-heading text-[18px] font-semibold text-parchment mb-2 tracking-[-0.2px]">
                    {item.title}
                  </h4>
                  <p className="text-[13.5px] leading-[1.7] text-parchment/50 m-0">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What clubs control */}
          <div className="reveal marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6 mb-16">
            {[
              {
                title: 'Full Partner Control',
                description: 'You choose which clubs to partner with. Accept or decline any incoming agreement request. Revoke access at any time.',
                icon: (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: 'Property-Level Sharing',
                description: 'Share all your properties or just specific ones. Set rod limits, blackout dates, and seasonal restrictions for visiting anglers.',
                icon: (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                ),
              },
              {
                title: 'Trust Stays Intact',
                description: 'Every visiting angler is vetted by their home club. Landowners and partner clubs know exactly who is on the water and which club vouches for them.',
                icon: (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`reveal d${i + 1} bg-parchment/6 border border-parchment/12 rounded-[14px] px-7 py-9`}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-river/15 flex items-center justify-center mb-5 text-river-light">
                  {card.icon}
                </div>
                <h3 className="font-heading text-[20px] font-semibold text-parchment mb-2.5 tracking-[-0.2px]">
                  {card.title}
                </h3>
                <p className="text-[14.5px] leading-[1.7] text-parchment/50 m-0">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          {/* Fee structure + tier eligibility */}
          <div className="reveal grid grid-cols-2 gap-6">
            <div className="bg-parchment/6 border border-parchment/12 rounded-[14px] px-8 py-8">
              <h3 className="font-heading text-[20px] font-semibold text-parchment mb-4 tracking-[-0.2px]">
                Transparent Fee Structure
              </h3>
              <p className="text-[14.5px] leading-[1.7] text-parchment/50 mb-5">
                Cross-club bookings carry a small per-rod access fee, paid by the angler on
                top of the property&rsquo;s base rate. This fee funds the network and rewards
                clubs for participation.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-bronze/20 text-bronze text-[11px] font-semibold mt-0.5">$</span>
                  <div>
                    <p className="text-[14px] font-medium text-parchment m-0">$25 per rod cross-club access fee</p>
                    <p className="text-[13px] text-parchment/40 m-0 mt-0.5">Paid by the angler, added at checkout</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-river/20 text-river-light text-[11px] font-semibold mt-0.5">$5</span>
                  <div>
                    <p className="text-[14px] font-medium text-parchment m-0">$5 referral credit to the home club</p>
                    <p className="text-[13px] text-parchment/40 m-0 mt-0.5">Earned every time your member books cross-club water</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-forest/30 text-parchment/70 text-[11px] font-semibold mt-0.5">$20</span>
                  <div>
                    <p className="text-[14px] font-medium text-parchment m-0">$20 to AnglerPass</p>
                    <p className="text-[13px] text-parchment/40 m-0 mt-0.5">Covers network operations, vetting infrastructure, and support</p>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-parchment/40 mt-4 m-0">
                The hosting club still receives its standard $5/rod commission from the
                rod fee &mdash; same as any booking. Cross-club fees are additional, not a replacement.
              </p>

              {/* Concrete example */}
              <div className="mt-5 bg-parchment/5 border border-parchment/10 rounded-[10px] px-5 py-4">
                <p className="text-[13px] font-medium text-parchment mb-3 m-0">
                  Example: Your member books 2 rods for 3 days at a partner club&rsquo;s water
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-parchment/50">Cross-club fee: $25/rod &times; 2 rods &times; 3 days</span>
                    <span className="text-parchment font-medium">$150</span>
                  </div>
                  <div className="border-t border-parchment/10 my-1" />
                  <div className="flex justify-between text-[13px]">
                    <span className="text-parchment/50">AnglerPass receives ($20 &times; 6)</span>
                    <span className="text-parchment/60">$120</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-river-light">Your club receives ($5 &times; 6)</span>
                    <span className="text-river-light font-semibold">$30</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-parchment/6 border border-parchment/12 rounded-[14px] px-8 py-8">
              <h3 className="font-heading text-[20px] font-semibold text-parchment mb-4 tracking-[-0.2px]">
                Available on Every Plan
              </h3>
              <p className="text-[14.5px] leading-[1.7] text-parchment/50 mb-5">
                Every club can participate in the cross-club network. Higher tiers unlock
                more partner agreements, so the network grows with your club.
              </p>
              <div className="space-y-2.5">
                {[
                  { plan: 'Starter', note: 'Up to 2 partner agreements' },
                  { plan: 'Standard', note: 'Up to 10 partner agreements' },
                  { plan: 'Pro', note: 'Unlimited partner agreements' },
                ].map((tier) => (
                  <div key={tier.plan} className="flex items-center gap-3 bg-parchment/5 rounded-lg px-4 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-river-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div>
                      <span className="text-[14px] font-medium text-parchment">{tier.plan}</span>
                      <span className="text-[12.5px] text-parchment/40 ml-2">{tier.note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-parchment/40 mt-5 m-0">
                Cross-club access is opt-in &mdash; your club decides if and when to participate.
                You can join the network at any time from your club settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-20 bg-parchment-light">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            The Trust Layer
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
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

      {/* Dashboard Preview */}
      <DashboardPreviewSection role="club" />

      {/* FAQ */}
      <ClubFaqSection />

      {/* Learn more */}
      <section className="py-12 bg-offwhite text-center">
        <div className="max-w-[500px] mx-auto px-8">
          <p className="text-[15px] text-text-secondary mb-3">
            Thinking about starting a club?
          </p>
          <Link
            href="/learn/how-to-start-a-fly-fishing-club"
            className="text-river font-medium underline hover:text-forest transition-colors text-[15px]"
          >
            Read: How to Start a Fly Fishing Club &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
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
