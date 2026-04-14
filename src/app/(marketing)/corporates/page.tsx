import Link from 'next/link';
import AudienceFaqAccordion from '@/components/shared/AudienceFaqAccordion';
import { PAGES_SEO, buildJsonLd } from '@/lib/seo';

export const metadata = PAGES_SEO.corporates;

const corporateFaqJsonLd = buildJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a corporate membership on AnglerPass?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A corporate membership lets your company join a fly fishing club on AnglerPass with a single corporate initiation fee. Once active, you can invite unlimited employees who pay only annual dues — no individual initiation fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do employees join under a corporate membership?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The corporate account administrator invites employees by email from the corporate dashboard. Each employee receives a link to create their AnglerPass account and is automatically added to the club with no initiation fee.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can corporate employees book private water?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Corporate employees become full angler members of the club and can browse properties, book fishing days, and access cross-club water — just like any other member.',
      },
    },
  ],
});

const features = [
  {
    title: 'One Fee, Full Team Access',
    description:
      'Pay a single corporate initiation fee to join a club. Every employee you invite skips the individual initiation fee entirely \u2014 they only pay standard annual\u00A0dues.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    title: 'Unlimited Employee Invitations',
    description:
      'Invite as many team members as you want from a simple dashboard. Each employee gets their own angler account with full booking access across the club\'s private\u00A0waters.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Cross-Club Water Access',
    description:
      'Your employees don\'t just fish one club\'s water. Through AnglerPass\'s cross-club agreements, they can book private properties managed by other clubs in the\u00A0network.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    title: 'Corporate Dashboard',
    description:
      'Manage your membership, invite employees, track team activity, and handle billing from a dedicated corporate dashboard \u2014 purpose-built for company\u00A0administrators.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: 'Club-Vetted Trust Model',
    description:
      'Your employees fish under the same trust framework as every other club member. Each club vets its members, which is what gives landowners confidence to open their\u00A0gates.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'A Perk That Stands Out',
    description:
      'Private fly fishing access is an employee benefit people actually remember. Differentiate your company with something meaningful \u2014 not another gift\u00A0card.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
];

export default function CorporateMembershipsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: corporateFaqJsonLd }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="audience-hero-badge inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Corporate Memberships
          </span>
          <h1 className="audience-hero-heading font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Private Water for<br />Your Entire&nbsp;Team.
          </h1>
          <p className="audience-hero-sub text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto mb-10">
            One corporate membership. Unlimited employee access. Give your team
            exclusive fly fishing on private waters through AnglerPass &mdash; with
            no individual initiation fees for&nbsp;staff.
          </p>
          <div className="audience-hero-ctas flex gap-3.5 justify-center flex-wrap">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-[34px] py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              Join the Waitlist &rarr;
            </Link>
            <Link
              href="#how-it-works"
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
              Why Corporate Memberships
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Give your team something worth&nbsp;talking&nbsp;about
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              A corporate membership through AnglerPass is a meaningful team benefit
              that connects people with exceptional outdoor experiences on
              private&nbsp;water.
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

      {/* How it works */}
      <section id="how-it-works" className="py-[100px] bg-parchment-light">
        <div className="reveal max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            How It Works
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            Three steps to private water for your&nbsp;team
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[620px] mx-auto mb-12">
            Getting started is straightforward. Find a club that offers corporate
            memberships, pay one initiation fee, and start inviting your&nbsp;team.
          </p>
          <div className="marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6 text-left">
            {[
              {
                step: '01',
                title: 'Find a Club',
                text: 'Browse fly fishing clubs on AnglerPass that offer corporate memberships. Each club sets its own corporate initiation fee and annual\u00A0dues.',
              },
              {
                step: '02',
                title: 'Join as a Corporation',
                text: 'Pay the one-time corporate initiation fee. Your company becomes a member of the club with its own corporate dashboard for managing\u00A0everything.',
              },
              {
                step: '03',
                title: 'Invite Your Team',
                text: 'Add employees from the dashboard. Each person gets full angler access to private waters \u2014 with no individual initiation fee. They only pay annual\u00A0dues.',
              },
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

      {/* Fee structure */}
      <section className="py-20 bg-offwhite">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            Pricing
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            One fee covers everyone
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto mb-8">
            Corporate memberships simplify the economics of club access.
            Your company pays a single initiation fee, and every employee
            you invite skips their own. Here&rsquo;s how&nbsp;it&nbsp;breaks&nbsp;down:
          </p>
          <div className="bg-white border border-parchment rounded-[14px] px-8 py-7 max-w-[520px] mx-auto text-left">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-light mb-4">
              Corporate membership breakdown
            </p>
            <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-parchment">
              <span className="text-sm text-text-secondary">Corporate initiation fee (one-time)</span>
              <span className="text-sm font-semibold text-forest">Set by club</span>
            </div>
            <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-parchment">
              <span className="text-sm text-text-secondary">Employee initiation fee</span>
              <span className="text-sm font-semibold text-bronze">$0</span>
            </div>
            <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-parchment">
              <span className="text-sm text-text-secondary">Annual dues (per employee)</span>
              <span className="text-sm font-semibold text-forest">Set by club</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Booking fees (per fishing day)</span>
              <span className="text-sm font-semibold text-forest">Rod fee + 15%</span>
            </div>
          </div>
          <p className="text-[13px] text-text-light mt-4 italic">
            No per-seat licenses. No platform subscription. Invite as many
            employees as you&nbsp;like.
          </p>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[800px] mx-auto px-8">
          <div className="reveal text-center mb-[60px]">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              Use Cases
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              More than a team outing
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: 'Client Entertainment',
                description:
                  'Take clients to private water for a memorable experience. A day on a secluded spring creek makes a stronger impression than another steak\u00A0dinner.',
              },
              {
                title: 'Team Retreats',
                description:
                  'Book multi-day trips on private properties. No crowds, no pressure \u2014 just time on the water with the people who\u00A0matter.',
              },
              {
                title: 'Employee Retention',
                description:
                  'Offer a benefit that people actually use. Fishing access through AnglerPass gives outdoor-minded employees a reason to stay\u00A0engaged.',
              },
              {
                title: 'Executive Perks',
                description:
                  'Provide leadership teams with access to exceptional private water. It\'s a perk that signals your company values quality and the\u00A0outdoors.',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`reveal d${(i % 2) + 1} bg-white border border-parchment rounded-[14px] px-7 py-8`}
              >
                <h3 className="font-heading text-[20px] font-semibold text-forest mb-2.5 tracking-[-0.2px]">
                  {item.title}
                </h3>
                <p className="text-[14.5px] leading-[1.7] text-text-secondary m-0">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employee callout */}
      <section className="py-20 bg-offwhite">
        <div className="reveal max-w-[700px] mx-auto px-8">
          <div className="bg-bronze/5 border border-bronze/15 rounded-xl px-8 py-10 text-center">
            <h3 className="font-heading text-[clamp(24px,3vw,34px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Already an Employee of a Corporate&nbsp;Member?
            </h3>
            <p className="text-[15px] leading-[1.65] text-text-secondary max-w-[480px] mx-auto">
              If your employer already has a corporate membership on AnglerPass,
              ask them for an invitation. You&rsquo;ll join the club as an angler
              with no initiation fee &mdash; just annual&nbsp;dues.
            </p>
          </div>
        </div>
      </section>

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
                q: 'What is a corporate membership on AnglerPass?',
                a: 'A corporate membership lets your company join a fly fishing club with a single corporate initiation fee. Once active, you can invite unlimited employees who each skip the individual initiation fee and pay only standard annual club dues.',
              },
              {
                q: 'How do employees get access?',
                a: 'From the corporate dashboard, administrators invite employees by email. Each employee receives a link to create their AnglerPass account and is automatically added to the club as a full angler member with booking access.',
              },
              {
                q: 'What can corporate employees do on the platform?',
                a: 'Everything a regular club member can do. They can browse private water properties, book fishing days, access cross-club water, add optional guides to trips, and manage their own angler profile.',
              },
              {
                q: 'Is there a limit on how many employees we can invite?',
                a: 'No. Corporate memberships allow unlimited employee invitations. Each employee pays only annual dues, not an initiation fee.',
              },
              {
                q: 'How much does a corporate membership cost?',
                a: 'Each club sets its own corporate initiation fee and annual dues. You can browse clubs on AnglerPass to compare pricing. The platform itself charges no subscription or per-seat fee for corporate memberships.',
              },
              {
                q: 'Can we join multiple clubs?',
                a: 'Corporate memberships are with a single home club. However, through AnglerPass\'s cross-club access agreements, your employees may be able to book water managed by other clubs in the network depending on the agreements your home club has in place.',
              },
              {
                q: 'What happens if an employee leaves the company?',
                a: 'Corporate administrators can revoke employee access from the dashboard at any time. The employee\'s club membership is deactivated and they lose access to booking through the corporate membership.',
              },
              {
                q: 'Who manages the corporate membership?',
                a: 'The person who sets up the membership becomes the corporate account administrator. They manage employee invitations, billing, and company profile from a dedicated corporate dashboard.',
              },
            ]}
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
            Give your team access to water worth&nbsp;fishing
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-10 leading-[1.7]">
            Join the waitlist and be among the first companies to offer
            private fly fishing access as a corporate&nbsp;benefit.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              Join the Waitlist
            </Link>
            <Link
              href="/clubs"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-transparent text-parchment border border-parchment/20 transition-all duration-[400ms]"
            >
              Browse Clubs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
