import type { Metadata } from 'next';
import Image from 'next/image';
import { SITE_URL } from '@/lib/seo';
import CareersModal from '@/components/shared/CareersModal';

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
    photo: '/images/team/dan-jahn.webp',
    bio: 'Dan Jahn built AnglerPass together with some lifelong fly-fishing friends who run one of the country\u2019s most respected fly-fishing clubs. A leadership coach, author, and speaker whose work spans 68 countries, and founder and owner of a 30+ year technology consulting firm, Dan built AnglerPass after years of seeing high-quality private water sit underutilized while capable anglers couldn\u2019t access it. His background in building and leading organizations across business, education, and the arts\u00a0\u2014 combined with three decades of technology consulting\u00a0\u2014 gave him both the industry perspective and the technical instinct to build the platform that fly-fishing\u2019s private-water ecosystem has been\u00a0missing.',
  },
  {
    name: 'Marcus Johnstone',
    title: 'Director of Technology',
    slug: 'marcus-johnstone',
    photo: null,
    bio: 'Marcus Johnstone brings 29 years of experience in full-stack development and technology leadership, specializing in architecting scalable cloud-based systems across public and private sectors. He leads technical vision and product development for high-growth platforms, with deep expertise in modern web technologies and enterprise application\u00a0architecture.',
  },
  {
    name: 'Casey Prather',
    title: 'Director of Strategic Partnerships',
    slug: 'casey-prather',
    photo: '/images/team/casey-prather.webp',
    bio: 'Casey Prather is the President and Director of Operations for Rocky Mountain Angling Club. Born and raised in Northern Colorado, Casey has spent 25 years working in the fishing industry in multiple facets. When not out fly fishing, Casey can be found working his bird dogs or spending time with his family. As an accomplished fly tyer, Casey lives by the motto \u201cif it swims, I want to throw a fly at it,\u201d which has led him through many angling adventures across the world. Guided by a commitment to conservation and a dedication to the club\u2019s landowners and members, Casey\u2019s focus is on providing access to quality water while preserving the environments that make the sport\u00a0unique.',
  },
  {
    name: 'Nate Vigil',
    title: 'Director of Platform Operations',
    slug: 'nate-vigil',
    photo: '/images/team/nate-vigil.webp',
    bio: 'Nate Vigil is the Vice President of Member Services at the Rocky Mountain Angling Club. Born and raised in Colorado, Nate has cultivated a lifelong passion for the outdoors, with fly fishing at its center for over 20 years. He began his career in the industry as a fishing sales associate and has spent the past decade connecting private landowners with passionate anglers. Driven by a commitment to conservation, Nate strives to create meaningful access to quality waters while preserving the landscapes that make the sport so\u00a0special.',
  },
  {
    name: 'Dan Haskin',
    title: 'Outreach Coordinator',
    slug: 'dan-haskin',
    photo: '/images/team/dan-haskin.webp',
    bio: 'Grounded in years of hands-on experience in the outdoor industry, Dan focuses on helping people build confidence in new forms of recreation\u00a0\u2014 especially on and around the water. Whether connecting anglers to new opportunities or introducing beginners to the sport, his work centers on making outdoor access more approachable, practical, and\u00a0rewarding.',
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
            A team of technologists, anglers, and outdoor industry veterans working
            to modernize private fly fishing&nbsp;access.
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[900px] mx-auto px-8 space-y-16">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.slug}
              className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] md:gap-10"
            >
              {/* Headshot */}
              <div className="flex justify-center md:justify-start">
                <div className="size-[180px] shrink-0 rounded-full bg-parchment border-2 border-parchment-light flex items-center justify-center overflow-hidden">
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
              </div>

              {/* Name + Title + Bio */}
              <div className="text-center md:text-left">
                <h2 className="font-heading text-[24px] font-semibold text-forest tracking-[-0.2px] mb-1">
                  {member.name}
                </h2>
                <p className="text-[12px] font-mono uppercase tracking-[0.15em] text-bronze mb-4">
                  {member.title}
                </p>

                {member.bio ? (
                  <p className="text-[15px] leading-[1.75] text-text-secondary">
                    {member.bio}
                  </p>
                ) : (
                  <div className="space-y-2 max-w-[400px] mx-auto md:mx-0">
                    <div className="h-3 w-full rounded bg-stone-light/15" />
                    <div className="h-3 w-[90%] rounded bg-stone-light/15" />
                    <div className="h-3 w-[95%] rounded bg-stone-light/15" />
                    <div className="h-3 w-[70%] rounded bg-stone-light/15" />
                  </div>
                )}
              </div>
            </div>
          ))}
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
          <CareersModal
            trigger={
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-sm font-medium bg-forest text-white no-underline transition-all duration-300 hover:bg-forest-deep hover:-translate-y-0.5 hover:shadow-lg">
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
              </button>
            }
          />
        </div>
      </section>
    </>
  );
}
