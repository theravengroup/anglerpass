import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Download, Mail } from "lucide-react";
import { buildMetadata, buildJsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Press | AnglerPass — Private Water Fly Fishing Marketplace",
  description:
    "Press resources, media kit, and company information for AnglerPass — the first marketplace connecting anglers, fly fishing clubs, private water landowners, and guides.",
  path: "/press",
  keywords: [
    "anglerpass press",
    "anglerpass media kit",
    "private water fly fishing press release",
    "fly fishing marketplace news",
  ],
});

const pressJsonLd = buildJsonLd({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AnglerPass Press Resources",
  url: `${SITE_URL}/press`,
  description:
    "Press resources, media kit, and company information for AnglerPass.",
  publisher: {
    "@type": "Organization",
    name: "AnglerPass",
    url: SITE_URL,
  },
});

const KEY_FACTS = [
  { label: "Company", value: "AnglerPass\n(Angler Pass, LLC)" },
  { label: "Headquarters", value: "Denver, Colorado" },
  { label: "Launch", value: "May 15, 2026" },
  { label: "Founder", value: "Dan Jahn" },
  { label: "What", value: "Private water fly fishing marketplace" },
  { label: "Website", value: "anglerpass.com" },
];

export default function PressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pressJsonLd }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(58,107,124,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-[800px] px-8 text-center">
          <span className="mb-5 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Press Resources
          </span>
          <h1 className="mb-6 font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] tracking-[-0.5px] text-parchment">
            AnglerPass Press Resources
          </h1>
          <p className="mx-auto max-w-[560px] text-[17px] leading-[1.7] text-parchment/60">
            Everything you need to cover the first marketplace
            for&nbsp;private&nbsp;water&nbsp;fly&nbsp;fishing.
          </p>
        </div>
      </section>

      {/* Key Facts */}
      <section className="bg-offwhite py-[80px]">
        <div className="mx-auto max-w-[900px] px-8">
          <div className="reveal mb-10">
            <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              At a Glance
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] tracking-[-0.3px] text-forest">
              Key Facts
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_FACTS.map((fact) => (
              <div
                key={fact.label}
                className="reveal rounded-[14px] border border-parchment bg-white px-6 py-5"
              >
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-text-light">
                  {fact.label}
                </span>
                <p className="whitespace-pre-line text-[16px] font-medium leading-[1.5] text-forest">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Release */}
      <section className="bg-parchment-light py-[100px]">
        <div className="mx-auto max-w-[800px] px-8">
          <div className="reveal mb-10">
            <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              Press Release
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] tracking-[-0.3px] text-forest">
              Press Release &mdash; April 2026
            </h2>
          </div>

          <article className="reveal rounded-[14px] border border-parchment bg-white px-8 py-10 sm:px-12">
            <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-text-light">
              For Immediate Release
            </p>

            <h3 className="mb-6 font-heading text-[clamp(22px,3vw,30px)] font-medium leading-[1.2] tracking-[-0.3px] text-forest">
              The Best Trout Water in America Is Behind Locked Gates. AnglerPass
              Opens Them.
            </h3>

            <p className="mb-8 text-[15px] font-medium leading-[1.7] text-text-secondary">
              New platform connects anglers, fly fishing clubs, private water
              landowners, and guides in one marketplace &mdash; launching May 15,
              2026
            </p>

            <p className="mb-5 text-[14px] font-medium uppercase tracking-[0.1em] text-text-light">
              Livingston, MT &mdash; April 8, 2026
            </p>

            <div className="space-y-5 text-[16px] leading-[1.75] text-text-secondary">
              <p>
                Every fly fisher knows the feeling. You&rsquo;re driving through
                ranch country, and there it is &mdash; a spring creek bending
                through cottonwoods, risers dimpling the surface. And between you
                and that water: a locked gate and no idea who to call.
              </p>

              <p>
                AnglerPass (anglerpass.com) launches May 15 as the first platform
                connecting all four participants in the private water ecosystem
                &mdash; anglers, clubs, landowners, and guides &mdash; in a
                single marketplace.
              </p>

              <p>
                Private water access today runs on handshakes, spreadsheets, and
                knowing the right people. Clubs manage rosters in Excel.
                Landowners can&rsquo;t vet who&rsquo;s on their property. Anglers
                without connections can&rsquo;t find bookable water. Guides
                operate with no standardized verification. AnglerPass brings all
                of it onto one platform without stripping away the trust and
                stewardship that make private water worth protecting.
              </p>

              <p>
                &ldquo;I built this because I got tired of watching great water
                sit empty while good anglers couldn&rsquo;t find access,&rdquo;
                said founder Dan Jahn. &ldquo;Clubs, landowners, and guides are
                already doing the hard work. We give them better tools and connect
                them to each other.&rdquo;
              </p>

              <p>
                The model is simple: every angler belongs to a club, and every
                property is managed by a club. Clubs remain the vetting layer that
                landowners trust and anglers respect. AnglerPass doesn&rsquo;t
                bypass that relationship &mdash; it strengthens it.
              </p>

              <p>
                The standout feature is cross-club access. A single club
                membership can unlock water managed by partner clubs across the
                network. That kind of reach has never existed digitally in fly
                fishing.
              </p>

              <p>
                The platform also introduces the industry&rsquo;s most rigorous
                guide verification &mdash; background checks through Checkr,
                credential monitoring, and automatic suspension when licenses or
                insurance lapse. Every guide on AnglerPass is verified before they
                meet a client.
              </p>

              <p>
                An AI trip planner called AnglerPass Compass rounds out the angler
                experience with personalized recommendations based on water
                conditions, hatch timing, and gear.
              </p>

              <p>
                The waitlist is live now at{" "}
                <Link
                  href="/"
                  className="font-medium text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:text-forest-deep"
                >
                  anglerpass.com
                </Link>
                . Anglers, club managers, landowners, and guides each select their
                role for tailored onboarding at launch. Early members receive
                priority access.
              </p>
            </div>

            {/* About boilerplate */}
            <div className="mt-10 border-t border-parchment pt-8">
              <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-text-light">
                About AnglerPass
              </h4>
              <p className="text-[15px] leading-[1.75] text-text-secondary">
                AnglerPass is a private water fly fishing marketplace connecting
                anglers, clubs, landowners, and guides on one platform. By keeping
                clubs at the center of every transaction, AnglerPass preserves the
                trust that defines private water access while giving every
                participant modern tools for memberships, bookings, listings, and
                guide services. Headquartered in Denver, Colorado. Learn more at{" "}
                <Link
                  href="/"
                  className="font-medium text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:text-forest-deep"
                >
                  anglerpass.com
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-offwhite py-[100px]">
        <div className="mx-auto max-w-[900px] px-8">
          <div className="reveal mb-10">
            <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
              Founder
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] tracking-[-0.3px] text-forest">
              About the Founder
            </h2>
          </div>

          <div className="reveal grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] border border-parchment">
              <Image
                src="/images/team/dan-jahn-founder-headshot-webres.webp"
                alt="Dan Jahn, Founder of AnglerPass"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 300px"
              />
            </div>

            <div>
              <h3 className="mb-1 font-heading text-[24px] font-medium leading-[1.2] text-forest">
                Dan Jahn
              </h3>
              <p className="mb-5 font-mono text-[12px] uppercase tracking-[0.15em] text-text-light">
                Founder, AnglerPass
              </p>

              <p className="mb-6 text-[16px] leading-[1.75] text-text-secondary">
                Dan Jahn is the founder of AnglerPass and built AnglerPass
                together with some lifelong fly fisher friends who run one of the
                country&rsquo;s most respected fly fishing clubs. A leadership
                coach, author, and speaker whose work spans 68 countries, founder
                and owner of a 30-year+ technology consulting firm, Dan built
                AnglerPass after years of watching quality private water sit
                underutilized while capable anglers couldn&rsquo;t find access.
                His background building and leading organizations across business,
                education, and the arts &mdash; combined with three decades of
                technology consulting &mdash; gave him both the industry
                perspective and the technical instinct to build the platform fly
                fishing&rsquo;s private water ecosystem has been missing.
              </p>

              <blockquote className="border-l-[3px] border-bronze pl-6">
                <p className="text-[17px] font-medium leading-[1.6] text-forest italic">
                  &ldquo;The best trout water in America doesn&rsquo;t need more
                  technology. It needs a better handshake &mdash; one where clubs,
                  landowners, guides, and anglers can all trust each other before
                  anyone opens a gate.&rdquo;
                </p>
                <cite className="mt-3 block font-mono text-[11px] not-italic uppercase tracking-[0.15em] text-text-light">
                  &mdash; Dan Jahn
                </cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="bg-parchment-light py-[80px]">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <div className="reveal">
            <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              Downloads
            </span>
            <h2 className="mb-4 font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] tracking-[-0.3px] text-forest">
              Media Kit
            </h2>
            <p className="mx-auto mb-8 max-w-[500px] text-[16.5px] leading-[1.7] text-text-secondary">
              Download logos, product screenshots, founder headshot, and the
              backgrounder fact sheet.
            </p>

            <a
              href="/downloads/anglerpass-media-kit.zip"
              className="inline-flex items-center gap-2 rounded-md bg-bronze px-8 py-4 text-sm font-medium tracking-[0.3px] text-white no-underline transition-all duration-[400ms] hover:bg-bronze/90"
            >
              <Download className="size-4" />
              Download Media Kit
            </a>

            <p className="mx-auto mt-5 max-w-[440px] text-[13px] leading-[1.6] text-text-light">
              Includes: Logo files (PNG, SVG), product screenshots, founder
              headshot, and press backgrounder (PDF).
            </p>
          </div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="bg-forest-deep py-[100px] text-center">
        <div className="reveal mx-auto max-w-[600px] px-8">
          <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Get in Touch
          </span>
          <h2 className="mb-5 font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] tracking-[-0.3px] text-parchment">
            Media Contact
          </h2>

          <a
            href="mailto:press@anglerpass.com"
            className="mb-6 inline-flex items-center gap-2 rounded-md border border-parchment/20 bg-transparent px-8 py-4 text-sm font-medium tracking-[0.3px] text-parchment no-underline transition-all duration-[400ms] hover:bg-parchment/10"
          >
            <Mail className="size-4" />
            press@anglerpass.com
          </a>

          <p className="mx-auto mt-4 max-w-[440px] text-[14px] leading-[1.7] text-parchment/50">
            We respond within 24 hours. If you&rsquo;re on deadline, include
            URGENT in your subject line.
          </p>
        </div>
      </section>
    </>
  );
}
