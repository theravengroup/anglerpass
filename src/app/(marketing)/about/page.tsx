import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGES_SEO, buildJsonLd, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = PAGES_SEO.about;

const organizationJsonLd = buildJsonLd({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AnglerPass',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'AnglerPass is a private water fly fishing marketplace connecting anglers, fly fishing clubs, and landowners for exclusive access bookings.',
  sameAs: [
    'https://www.facebook.com/anglerpass',
    'https://www.instagram.com/anglerpass',
    'https://twitter.com/anglerpass',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'hello@anglerpass.com',
    telephone: '+1-303-586-1008',
  },
});

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(58,107,124,0.12),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            About AnglerPass
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            The Private Water<br />Fly Fishing Platform
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto">
            AnglerPass is the only platform that connects fly anglers, fly
            fishing clubs, and private landowners in a single marketplace for
            private water access.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[800px] mx-auto px-8">
          <div className="reveal mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              What We Do
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px]">
              A three-sided marketplace for private water
            </h2>
            <p className="text-[16.5px] leading-[1.7] text-text-secondary">
              Private fly fishing water in the United States is fragmented,
              inaccessible, and poorly managed. Landowners have water but no way
              to monetize it safely. Clubs have members but no modern tools.
              Anglers want access but have no way to find it.
            </p>
            <p className="text-[16.5px] leading-[1.7] text-text-secondary mt-4">
              AnglerPass solves this by giving each side what it needs. Clubs get
              management software &mdash; membership enrollment, dues collection,
              property listings, and booking calendars. Landowners get a
              professional way to earn income from their water without managing
              strangers. Anglers get access to private water they could never
              find on their own.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              How It Works
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px]">
              Clubs are the trust layer
            </h2>
            <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[600px] mx-auto">
              Unlike open booking platforms, AnglerPass is built on a club-based
              model. Fly fishing clubs serve as the trust layer between
              landowners and anglers. Every angler on the platform is a vetted
              member of at least one club.
            </p>
          </div>

          <div className="marketing-grid-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                label: 'Landowners',
                color: 'forest',
                text: 'Register your property and affiliate with a club. The club handles vetting and bookings. You set your rates and get paid.',
              },
              {
                label: 'Clubs',
                color: 'river',
                text: 'Manage memberships, vet anglers, list private water properties, and coordinate bookings. Earn revenue from the network.',
              },
              {
                label: 'Anglers',
                color: 'bronze',
                text: 'Join a club, get vetted, and book access to private water. Cross-club access lets you fish beyond your home club.',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="reveal bg-white border border-parchment rounded-[14px] px-6 py-8 text-center"
              >
                <span
                  className={`inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-${item.color}`}
                >
                  {item.label}
                </span>
                <p className="text-[14.5px] leading-[1.7] text-text-secondary m-0">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Private Water Matters */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[800px] mx-auto px-8">
          <div className="reveal">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
              Why Private Water Matters
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px]">
              Better access, better conservation
            </h2>
            <p className="text-[16.5px] leading-[1.7] text-text-secondary mb-4">
              Public waters across the American West are under increasing
              pressure. Overcrowding degrades habitat, stresses fish
              populations, and diminishes the experience for everyone. Private
              water offers a release valve &mdash; managed access that limits
              rod pressure, funds habitat restoration, and gives fish the space
              to thrive.
            </p>
            <p className="text-[16.5px] leading-[1.7] text-text-secondary">
              When landowners earn income from fishing access, they have a direct
              financial incentive to protect riparian habitat, maintain stream
              health, and keep their water fishable for decades. AnglerPass
              aligns economic incentives with conservation outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
            Ready to explore?
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-10 leading-[1.7]">
            Whether you are an angler, a club, or a landowner &mdash; AnglerPass
            has a place for you.
          </p>
          <div className="flex gap-[14px] justify-center flex-wrap">
            <Link
              href="/anglers"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              For Anglers
            </Link>
            <Link
              href="/clubs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-transparent text-parchment border border-parchment/20 transition-all duration-[400ms]"
            >
              For Clubs
            </Link>
            <Link
              href="/landowners"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-transparent text-parchment border border-parchment/20 transition-all duration-[400ms]"
            >
              For Landowners
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
