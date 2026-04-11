import type { Metadata } from 'next';
import Link from 'next/link';
import AudienceFaqAccordion from '@/components/shared/AudienceFaqAccordion';
import DashboardPreviewSection from '@/components/shared/DashboardPreviewSection';
import { PAGES_SEO, buildJsonLd } from '@/lib/seo';

export const metadata: Metadata = PAGES_SEO.landowners;

const features = [
  {
    title: 'Property Registration',
    description:
      'Create detailed, professional profiles for each property and water. Define boundaries, species, regulations, and seasonal details in one place.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Booking Management',
    description:
      'Accept, decline, or manage access requests with a clean dashboard. No more spreadsheets, phone tag, or handshake-only arrangements.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
      </svg>
    ),
  },
  {
    title: 'Availability Calendars',
    description:
      'Set open dates, block off private periods, and define rod limits per day. Anglers see only what you make available.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Professional Profiles',
    description:
      'Showcase your property with photos, maps, species lists, and access terms. First impressions that match the quality of your water.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Inquiry Handling',
    description:
      'Receive and respond to access inquiries through a structured system. Track conversations, set response templates, and never lose a lead.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
];

const landownerFaqJsonLd = buildJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do landowners make money with AnglerPass?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Landowners partner with a member fly fishing club that lists and manages their property on AnglerPass. Anglers pay a booking fee for access, and the landowner receives a trespass fee negotiated directly with the managing club.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I have to manage bookings myself as a landowner?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The fly fishing club that manages your property handles all booking logistics, angler vetting, and calendar management through AnglerPass. You receive income without administrative burden.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my property protected from damage or misuse?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every club on AnglerPass carries its own liability insurance and requires members to sign waivers before accessing private water. All anglers are vetted club members with verified identities. Clubs enforce conduct standards, and AnglerPass provides verified trip records and a review system.',
      },
    },
  ],
});

export default function LandownersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: landownerFaqJsonLd }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(58,107,124,0.15),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="audience-hero-badge inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            For Landowners
          </span>
          <h1 className="audience-hero-heading font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Your Water. Your Rules.<br />Your Platform.
          </h1>
          <p className="audience-hero-sub text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto mb-10">
            Manage private water access with the professionalism your property
            deserves. Every angler who reaches your listing has been vetted by a
            fly fishing club &mdash; so you control access with confidence.
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
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
              What You Get
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Everything a landowner needs
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Purpose-built tools for managing private water access. Launching
              in the Rocky Mountain region and expanding nationwide.
            </p>
          </div>

          <div className="marketing-features-grid marketing-grid-3 grid grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`reveal d${(i % 3) + 1} bg-white border border-parchment rounded-[14px] px-7 py-9 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]`}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-forest/8 flex items-center justify-center mb-5 text-forest">
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

      {/* Trust / vetting section */}
      <section className="py-[100px] bg-parchment-light">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
            Built-In Trust
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            No strangers at your gate
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto">
            AnglerPass is not an open marketplace. Every angler who can view or book
            your property is a member of a fly fishing club that has vetted them.
            Clubs serve as the trust layer between you and the people on your water
            &mdash; so you never have to wonder who&rsquo;s showing up.
          </p>
        </div>
      </section>

      {/* Liability / Protection */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
              Your Protection
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
              Clubs carry the liability &mdash; not you
            </h2>
            <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[580px] mx-auto">
              Every club on AnglerPass maintains its own liability insurance and requires
              members to sign waivers before accessing private water. You don&rsquo;t manage
              any of it &mdash; the club handles everything.
            </p>
          </div>

          <div className="marketing-grid-3 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[860px] mx-auto">
            <div className="reveal d1 bg-white border border-parchment rounded-[14px] px-7 py-8 text-center">
              <div className="w-[44px] h-[44px] rounded-[10px] bg-forest/8 flex items-center justify-center mb-5 mx-auto text-forest">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-heading text-[18px] font-semibold text-forest mb-2 tracking-[-0.2px]">
                Club Insurance
              </h3>
              <p className="text-[14px] leading-[1.7] text-text-secondary m-0">
                Each club carries liability insurance that covers angler activity on your
                property. This is a requirement for clubs on the platform.
              </p>
            </div>

            <div className="reveal d2 bg-white border border-parchment rounded-[14px] px-7 py-8 text-center">
              <div className="w-[44px] h-[44px] rounded-[10px] bg-forest/8 flex items-center justify-center mb-5 mx-auto text-forest">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="font-heading text-[18px] font-semibold text-forest mb-2 tracking-[-0.2px]">
                Signed Waivers
              </h3>
              <p className="text-[14px] leading-[1.7] text-text-secondary m-0">
                Club members sign liability waivers as part of their membership. Every angler
                on your water has already signed before they arrive.
              </p>
            </div>

            <div className="reveal d3 bg-white border border-parchment rounded-[14px] px-7 py-8 text-center">
              <div className="w-[44px] h-[44px] rounded-[10px] bg-forest/8 flex items-center justify-center mb-5 mx-auto text-forest">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="font-heading text-[18px] font-semibold text-forest mb-2 tracking-[-0.2px]">
                Vetted Members Only
              </h3>
              <p className="text-[14px] leading-[1.7] text-text-secondary m-0">
                No anonymous visitors. Every person on your property is a known, vetted
                club member with a verified identity and booking record.
              </p>
            </div>
          </div>

          <p className="reveal text-center text-[14.5px] text-text-secondary mt-10 max-w-[520px] mx-auto leading-[1.7]">
            The club model means you receive income from your water while the clubs
            take on the operational and liability responsibilities. You focus on your
            land &mdash; they handle the rest.
          </p>
        </div>
      </section>

      {/* Club affiliation */}
      <section className="py-20 bg-parchment-light">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
            How It Works
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            Your property, backed by a club
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[580px] mx-auto mb-8">
            When you register a property on AnglerPass, you affiliate it with
            at least one fly fishing club. The club acts as the trust layer
            &mdash; vetting the anglers who can see and book your water.
          </p>
          <div className="marketing-grid-3 grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[640px] mx-auto text-left">
            <div className="bg-white border border-parchment rounded-xl px-5 py-5">
              <span className="inline-flex items-center justify-center size-8 rounded-lg bg-forest/8 text-forest font-heading text-[15px] font-bold mb-3">1</span>
              <h3 className="text-[14px] font-semibold text-forest mb-1.5">Register your property</h3>
              <p className="text-[13px] leading-[1.6] text-text-secondary m-0">
                Add your water with photos, species, rules, and GPS coordinates.
              </p>
            </div>
            <div className="bg-white border border-parchment rounded-xl px-5 py-5">
              <span className="inline-flex items-center justify-center size-8 rounded-lg bg-forest/8 text-forest font-heading text-[15px] font-bold mb-3">2</span>
              <h3 className="text-[14px] font-semibold text-forest mb-1.5">Choose a club</h3>
              <p className="text-[13px] leading-[1.6] text-text-secondary m-0">
                Browse clubs on the platform or invite a club you already work with. You choose who to affiliate with.
              </p>
            </div>
            <div className="bg-white border border-parchment rounded-xl px-5 py-5">
              <span className="inline-flex items-center justify-center size-8 rounded-lg bg-forest/8 text-forest font-heading text-[15px] font-bold mb-3">3</span>
              <h3 className="text-[14px] font-semibold text-forest mb-1.5">Start receiving bookings</h3>
              <p className="text-[13px] leading-[1.6] text-text-secondary m-0">
                Only vetted members of your affiliated clubs can view and book your water.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-club access */}
      <section className="py-[100px] bg-white">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
            The Network
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px] text-balance">
            More clubs, more demand, more bookings
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto">
            As more clubs join AnglerPass and opt in to cross-club access, your
            property reaches a growing network of vetted anglers &mdash; without any
            extra work on your part. Every new club in the network is a new source
            of qualified bookings for your water.
          </p>
        </div>
      </section>

      {/* Dashboard Preview */}
      <DashboardPreviewSection role="landowner" />

      {/* FAQ */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[700px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
              FAQ
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              Common questions
            </h2>
          </div>

          <AudienceFaqAccordion
            faqs={[
              {
                q: 'How does AnglerPass protect my property and privacy?',
                a: 'Your property is never visible to the general public. Only members of approved fly fishing clubs can see your listing. You control which clubs have access, and every angler who books has been vetted by their club before they can even view your water.',
              },
              {
                q: 'What does it cost me as a landowner?',
                a: 'There is no cost to list your property on AnglerPass. You set your own rod fees and receive 100% of those fees. A 15% platform fee is added on top and paid by the angler at checkout. Your rod fees are paid out weekly every Monday via Stripe Connect, after a 7-day post-trip hold period.',
              },
              {
                q: 'How do I control who accesses my property?',
                a: 'You have full control. You decide which clubs can offer your water to their members, set daily rod limits, define seasonal availability windows, and can block off private dates at any time. You can also require approval for individual bookings before they are confirmed.',
              },
              {
                q: 'What if someone damages my property or violates my rules?',
                a: 'Every club carries its own liability insurance and requires members to sign waivers — so you are protected before anyone sets foot on your property. If an issue arises, you report it through the platform and work with the club to resolve it. Clubs have a direct incentive to maintain good standing — repeated violations can result in a club losing access to your property.',
              },
              {
                q: 'Can I list multiple properties or water sections?',
                a: 'Yes. You can list as many properties as you own, each with its own profile, photos, species list, rules, pricing, and availability calendar. Many landowners list different stretches of the same river as separate properties.',
              },
              {
                q: 'How are rod fees and pricing determined?',
                a: 'You set your own rod fee per angler per day. You can price based on season, water type, or however you see fit. AnglerPass does not dictate pricing \u2014 you decide what your water is worth.',
              },
              {
                q: 'When do I get paid?',
                a: 'Payouts are processed weekly every Monday via Stripe Connect. After each trip, there is a 7-day hold period for dispute resolution. Once the hold clears, your rod fees are included in the next weekly payout and deposited directly to your bank account, typically arriving within 2 business days.',
              },
              {
                q: 'What kind of properties work on AnglerPass?',
                a: 'Any private water suitable for fly fishing — rivers, streams, spring creeks, ponds, and lakes. Properties range from small spring creeks to large ranch operations with miles of river frontage. If you have private water and want to manage access professionally, AnglerPass is built for you.',
              },
              {
                q: 'How do bookings and scheduling work?',
                a: 'You set your availability through a visual calendar. Anglers can only book dates you have opened and within the rod limits you define. You receive a notification for each booking and can see your upcoming schedule in your dashboard at any time.',
              },
              {
                q: 'Can I offer lodging alongside fishing access?',
                a: 'Yes. If you have lodging available through Airbnb, VRBO, or another platform, you can toggle on a lodging indicator and link directly to your listing. Anglers will see that lodging is available when they view your property, making multi-day trips easier to plan.',
              },
              {
                q: 'How do I get started?',
                a: 'There are two paths. If you already work with a fly fishing club, ask them about getting your property listed on AnglerPass \u2014 your club can walk you through the process and the affiliation is already in place. If you\u2019re exploring on your own, join the waitlist or contact us directly. When you register a property, you choose which club to affiliate with, and only their vetted members can see and book your water. Either way, you own your listing, set your rod rate, and control access. Most landowners are fully set up within a week.',
              },
            ]}
          />
        </div>
      </section>

      {/* Learn more */}
      <section className="py-12 bg-offwhite text-center">
        <div className="max-w-[500px] mx-auto px-8">
          <p className="text-[15px] text-text-secondary mb-3">
            Want to learn how other landowners earn from their water?
          </p>
          <Link
            href="/learn/how-landowners-can-earn-income-from-fly-fishing-access"
            className="text-forest font-medium underline hover:text-forest-deep transition-colors text-[15px]"
          >
            Read: How Landowners Earn Income from Fly Fishing Access &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
            Ready to modernize access to your water?
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-10 leading-[1.7]">
            Join the waitlist and be among the first landowners to use AnglerPass
            when we launch.
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
