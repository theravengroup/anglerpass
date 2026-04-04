import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conservation — AnglerPass',
  description:
    'Our commitment to conservation, habitat preservation, and responsible private water access.',
  openGraph: {
    title: 'Conservation — AnglerPass',
    description:
      'How AnglerPass supports conservation, catch-and-release practices, and sustainable access to private waters.',
  },
};

const TOC_ITEMS = [
  { href: '#commitment', label: 'Our Commitment' },
  { href: '#catch-and-release', label: 'Catch and Release' },
  { href: '#habitat', label: 'Habitat Preservation' },
  { href: '#access', label: 'Responsible Access' },
  { href: '#landowners', label: 'Supporting Landowners' },
  { href: '#community', label: 'Community Standards' },
  { href: '#future', label: 'Looking Ahead' },
];

export default function ConservationPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(74,154,98,0.12),_transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Conservation
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Protecting the Waters That Matter Most
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto">
            Private water access is a privilege built on stewardship. AnglerPass
            exists to support that responsibility, not undermine it.
          </p>
        </div>
      </section>

      {/* Content with sidebar TOC */}
      <section className="py-16 bg-offwhite lg:py-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">

            {/* Sidebar TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-[96px]" role="navigation" aria-label="Table of contents">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-light mb-4">
                  On this page
                </h2>
                <ul className="list-none m-0 p-0 border-l border-parchment">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="block py-1.5 pl-4 -ml-px text-[13px] text-text-secondary no-underline border-l border-transparent transition-colors duration-200 hover:text-forest hover:border-forest"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main content */}
            <div>
              {/* Mobile TOC */}
              <details className="lg:hidden mb-10 group">
                <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-parchment bg-white px-5 py-3.5 text-[14px] font-medium text-forest">
                  On this page
                  <svg
                    className="size-4 text-text-light transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <ul className="list-none m-0 mt-2 p-0 rounded-lg border border-parchment bg-white px-5 py-3">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="block py-1.5 text-[13px] text-river no-underline"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Our Commitment */}
              <section id="commitment" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Our Commitment
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  AnglerPass was built on a simple belief: the best fishing experiences
                  are inseparable from the health of the waters where they happen. Every
                  feature we build, every partnership we form, and every policy we set is
                  measured against that principle.
                </p>
                <p className="text-[15px] leading-[1.8] text-text-secondary">
                  We are not a volume platform. We do not optimize for maximum bookings
                  or maximum traffic. We optimize for long-term access to healthy,
                  well-managed fisheries &mdash; and that starts with conservation.
                </p>
              </section>

              {/* Catch and Release */}
              <section id="catch-and-release" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Catch and Release
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  AnglerPass strongly supports catch-and-release practices on all
                  private waters listed on the platform. While individual property
                  policies are set by landowners and clubs, we encourage every
                  participant in the AnglerPass ecosystem to prioritize the long-term
                  health of wild and native fish populations.
                </p>
                <div className="bg-white border border-parchment rounded-xl p-6 mb-4">
                  <h3 className="font-heading text-[18px] font-semibold text-forest mb-3">
                    Best practices we promote
                  </h3>
                  <ul className="list-none m-0 p-0 space-y-2.5">
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      Barbless hooks to minimize handling injury
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      Rubber mesh nets to protect slime coats and scales
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      Wet hands before handling fish
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      Minimize time out of water &mdash; especially for photos
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      Revive fish fully before release, facing upstream in current
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      Avoid fishing during extreme heat when water temperatures
                      stress fish
                    </li>
                  </ul>
                </div>
                <p className="text-[15px] leading-[1.8] text-text-secondary">
                  Properties on AnglerPass can specify their own catch-and-release
                  requirements, and we surface these clearly to anglers before they
                  book. Our review system also allows anglers and landowners to flag
                  concerns about fish handling practices.
                </p>
              </section>

              {/* Habitat Preservation */}
              <section id="habitat" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Habitat Preservation
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  Healthy fisheries depend on healthy ecosystems. Private landowners
                  who list on AnglerPass are often the most dedicated stewards of their
                  waters &mdash; managing riparian buffers, controlling erosion,
                  monitoring water quality, and protecting spawning habitat.
                </p>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  AnglerPass supports this stewardship by design:
                </p>
                <div className="bg-white border border-parchment rounded-xl p-6">
                  <ul className="list-none m-0 p-0 space-y-2.5">
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      <span>
                        <strong className="text-text-primary">Controlled access.</strong>{' '}
                        Rod limits, time slots, and seasonal closures protect waters
                        from overuse.
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      <span>
                        <strong className="text-text-primary">Club vetting.</strong>{' '}
                        Clubs screen anglers before granting access, ensuring only
                        responsible, qualified anglers reach the water.
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      <span>
                        <strong className="text-text-primary">Revenue for landowners.</strong>{' '}
                        Access fees give landowners a financial reason to invest in
                        habitat improvement rather than alternative land use.
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                      <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                      <span>
                        <strong className="text-text-primary">Seasonal awareness.</strong>{' '}
                        Property listings include seasonal conditions, helping anglers
                        make responsible timing decisions.
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Responsible Access */}
              <section id="access" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Responsible Access
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  Access to private water is earned, not assumed. AnglerPass is built
                  on the principle that controlled, respectful access benefits
                  everyone &mdash; landowners maintain the quality of their property,
                  clubs maintain their standards, and anglers gain access to
                  experiences that would otherwise be unavailable.
                </p>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  Every angler on AnglerPass agrees to:
                </p>
                <ul className="list-none m-0 p-0 space-y-2 mb-4">
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Respect property boundaries and posted rules
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Follow all property-specific conservation guidelines
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Leave the property in better condition than they found it
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Report any environmental concerns to the landowner or club
                  </li>
                </ul>
                <p className="text-[15px] leading-[1.8] text-text-secondary">
                  Anglers who violate property rules or conservation standards can be
                  removed from clubs, suspended from the platform, and flagged in
                  reviews. We take this seriously because the trust between
                  landowners and anglers is what makes private water access possible.
                </p>
              </section>

              {/* Supporting Landowners */}
              <section id="landowners" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Supporting Landowners
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  Landowners are the foundation of private water conservation. They
                  bear the cost of maintaining riparian habitat, managing water rights,
                  and protecting fish populations &mdash; often with little recognition
                  or financial support.
                </p>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  AnglerPass gives landowners tools to manage access on their own
                  terms: rod limits, seasonal availability, approved club partnerships,
                  and full control over who sets foot on their property. Revenue from
                  access fees flows directly to landowners, creating a sustainable
                  incentive for continued conservation investment.
                </p>
                <p className="text-[15px] leading-[1.8] text-text-secondary">
                  We believe that when landowners are compensated fairly for
                  responsible access, the result is better-managed waters, healthier
                  fish populations, and a stronger conservation ecosystem.
                </p>
              </section>

              {/* Community Standards */}
              <section id="community" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Community Standards
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  Conservation is a community effort. AnglerPass builds conservation
                  awareness into the platform experience:
                </p>
                <ul className="list-none m-0 p-0 space-y-2 mb-4">
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Property listings include conservation practices and expectations
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Trip reviews can highlight positive or concerning conservation
                    behavior
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Guides on the platform are verified professionals who model
                    responsible practices
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Clubs set and enforce their own conservation standards for members
                  </li>
                </ul>
                <p className="text-[15px] leading-[1.8] text-text-secondary">
                  We do not tolerate poaching, trespassing, littering, or deliberate
                  harm to fish or habitat. These behaviors result in immediate
                  suspension and permanent removal from the platform.
                </p>
              </section>

              {/* Looking Ahead */}
              <section id="future" className="mb-14 scroll-mt-24">
                <h2 className="font-heading text-[28px] font-semibold text-forest mb-4">
                  Looking Ahead
                </h2>
                <p className="text-[15px] leading-[1.8] text-text-secondary mb-4">
                  Conservation is not a feature we ship once. It is a commitment that
                  shapes how we build, grow, and make decisions as a company. As
                  AnglerPass expands, we are exploring ways to deepen our
                  conservation impact:
                </p>
                <ul className="list-none m-0 p-0 space-y-2 mb-4">
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Partnerships with conservation organizations like Trout Unlimited
                    and local watershed groups
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    A conservation fund supported by a portion of platform fees
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Water quality and fish population tracking tools for landowners
                  </li>
                  <li className="flex items-start gap-3 text-[14px] text-text-secondary leading-[1.7]">
                    <span className="mt-[5px] size-[7px] bg-forest/50 shrink-0 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]" />
                    Educational resources for anglers new to private water etiquette
                  </li>
                </ul>
                <p className="text-[15px] leading-[1.8] text-text-secondary">
                  The best private water experiences exist because someone chose to
                  protect them. AnglerPass is here to make sure that choice is
                  sustainable.
                </p>
              </section>

              {/* Footer link */}
              <div className="mt-12 pt-8 border-t border-parchment">
                <p className="text-[14px] text-text-light">
                  See also our{' '}
                  <Link href="/policies" className="text-river underline">
                    Platform Policies
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="text-river underline">
                    Terms of Service
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
