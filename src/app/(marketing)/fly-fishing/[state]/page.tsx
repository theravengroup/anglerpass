import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STATE_SEO_DATA } from '@/lib/state-seo-data';
import { buildJsonLd, SITE_URL } from '@/lib/seo';

interface PageProps {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  return STATE_SEO_DATA.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const data = STATE_SEO_DATA.find((s) => s.slug === state);
  if (!data) return {};

  const url = `${SITE_URL}/fly-fishing/${data.slug}`;

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: data.title,
      description: data.description,
      url,
      siteName: 'AnglerPass',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
  };
}

export default async function StatePage({ params }: PageProps) {
  const { state } = await params;
  const data = STATE_SEO_DATA.find((s) => s.slug === state);
  if (!data) notFound();

  const faqJsonLd = buildJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  });

  const breadcrumbJsonLd = buildJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Fly Fishing',
        item: `${SITE_URL}/fly-fishing`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.name,
        item: `${SITE_URL}/fly-fishing/${data.slug}`,
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[80px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.08),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 text-[12px] text-parchment/40"
          >
            <Link href="/" className="hover:text-parchment/60 no-underline">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-parchment/50">Fly Fishing</span>
            <span className="mx-2">/</span>
            <span className="text-parchment/60">{data.name}</span>
          </nav>

          <h1 className="font-heading text-[clamp(34px,4.5vw,52px)] font-medium leading-[1.15] text-parchment tracking-[-0.5px] mb-6">
            {data.h1}
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[600px] mx-auto">
            {data.intro}
          </p>
        </div>
      </section>

      {/* Notable Waters */}
      <section className="py-[80px] bg-offwhite">
        <div className="max-w-[800px] mx-auto px-8">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
            Notable Waters
          </span>
          <h2 className="font-heading text-[clamp(24px,3vw,34px)] font-medium leading-[1.15] text-forest mb-6 tracking-[-0.3px]">
            Famous fly fishing waters in {data.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.notableWaters.map((water) => (
              <div
                key={water}
                className="bg-white border border-parchment rounded-xl px-5 py-5"
              >
                <h3 className="font-heading text-[17px] font-semibold text-forest mb-1">
                  {water}
                </h3>
                <p className="text-[13px] text-text-light m-0">
                  {data.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Species */}
      <section className="py-[80px] bg-parchment-light">
        <div className="max-w-[800px] mx-auto px-8">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            Target Species
          </span>
          <h2 className="font-heading text-[clamp(24px,3vw,34px)] font-medium leading-[1.15] text-forest mb-6 tracking-[-0.3px]">
            What you can catch in {data.name}
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.targetSpecies.map((species) => (
              <span
                key={species}
                className="bg-white border border-parchment rounded-full px-4 py-2 text-[14px] text-forest font-medium"
              >
                {species}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-[80px] bg-offwhite">
        <div className="max-w-[800px] mx-auto px-8">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            FAQ
          </span>
          <h2 className="font-heading text-[clamp(24px,3vw,34px)] font-medium leading-[1.15] text-forest mb-8 tracking-[-0.3px]">
            Fly fishing in {data.name}
          </h2>
          <div className="space-y-6">
            {data.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-heading text-[18px] font-semibold text-forest mb-2">
                  {faq.question}
                </h3>
                <p className="text-[15px] leading-[1.7] text-text-secondary m-0">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[100px] bg-forest-deep text-center">
        <div className="max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(24px,3.5vw,38px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
            Book private fly fishing water in {data.name}
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-8 leading-[1.7]">
            Join a fly fishing club on AnglerPass and access private waters
            across {data.name} and beyond.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/explore?state=${encodeURIComponent(data.name)}`}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              Browse {data.name} Properties →
            </Link>
            <Link
              href="/anglers"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-parchment/10 text-parchment/70 transition-all duration-[400ms] hover:bg-parchment/15"
            >
              Learn More About AnglerPass
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
