import type { Metadata } from 'next';
import Image from 'next/image';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Our Team | AnglerPass',
  description:
    'Meet the team behind AnglerPass — the platform modernizing private fly fishing access for landowners, clubs, and anglers.',
  alternates: { canonical: `${SITE_URL}/team` },
  openGraph: {
    title: 'Our Team | AnglerPass',
    description:
      'Meet the team behind AnglerPass — the platform modernizing private fly fishing access.',
    url: `${SITE_URL}/team`,
    siteName: 'AnglerPass',
    type: 'website',
  },
};

const TEAM_MEMBERS = [
  {
    name: 'Dan Jahn',
    title: 'Founder + CEO',
    slug: 'dan-jahn',
    photo: '/images/team/dan-jahn-founder-headshot-webres.webp',
  },
  {
    name: 'Marcus Johnstone',
    title: 'Director of Technology',
    slug: 'marcus-johnstone',
    photo: null,
  },
  {
    name: 'Casey Prather',
    title: 'Director of Strategic Partnerships',
    slug: 'casey-prather',
    photo: null,
  },
  {
    name: 'Nate Vigil',
    title: 'Director of Marketplace Operations',
    slug: 'nate-vigil',
    photo: null,
  },
  {
    name: 'Dan Haskin',
    title: 'Outreach Coordinator',
    slug: 'dan-haskin',
    photo: null,
  },
] as const;

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(58,107,124,0.12),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Our Team
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            The People Behind<br />AnglerPass
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto">
            A team of builders, anglers, and outdoor industry veterans working
            to modernize private fly fishing&nbsp;access.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[1000px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.slug} className="flex flex-col items-center text-center">
                {/* Headshot */}
                <div className="size-[180px] rounded-full bg-parchment border-2 border-parchment-light mb-6 flex items-center justify-center overflow-hidden">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={`${member.name}, ${member.title}`}
                      width={180}
                      height={180}
                      className="size-full object-cover"
                    />
                  ) : (
                    <svg
                      className="size-16 text-stone-light/60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>

                {/* Name + Title */}
                <h2 className="font-heading text-[22px] font-semibold text-forest tracking-[-0.2px] mb-1">
                  {member.name}
                </h2>
                <p className="text-[13px] font-mono uppercase tracking-[0.12em] text-bronze mb-4">
                  {member.title}
                </p>

                {/* Bio placeholder */}
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-stone-light/15" />
                  <div className="h-3 w-[90%] mx-auto rounded bg-stone-light/15" />
                  <div className="h-3 w-[95%] mx-auto rounded bg-stone-light/15" />
                  <div className="h-3 w-[70%] mx-auto rounded bg-stone-light/15" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[80px] bg-parchment-light">
        <div className="max-w-[600px] mx-auto px-8 text-center">
          <h2 className="font-heading text-[clamp(26px,3vw,36px)] font-medium leading-[1.15] text-forest tracking-[-0.3px] mb-4">
            Interested in joining&nbsp;us?
          </h2>
          <p className="text-[16px] leading-[1.7] text-text-secondary mb-8">
            We&rsquo;re building something new for the outdoor industry. If
            you share our passion for fly fishing and technology, we&rsquo;d
            love to&nbsp;hear&nbsp;from&nbsp;you.
          </p>
          <a
            href="#"
            onClick={undefined}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-sm font-medium bg-forest text-white no-underline transition-all duration-300 hover:bg-forest-deep hover:-translate-y-0.5 hover:shadow-lg"
          >
            Get in Touch
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10m0 0L9 4m4 4L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}
