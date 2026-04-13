import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/posts';
import { renderMarkdown } from '@/lib/markdown';
import { buildJsonLd, SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || new Date(post.publishedAt).getTime() > Date.now()) return {};

  const url = `${SITE_URL}/learn/${post.slug}`;
  const ogImage = post.image
    ? `${SITE_URL}${post.image}`
    : `${SITE_URL}/og?title=${encodeURIComponent(post.title)}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'AnglerPass',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function LearnPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Gate: future-dated posts are not accessible
  if (new Date(post.publishedAt).getTime() > Date.now()) notFound();

  const related = getRelatedPosts(slug, 3);

  const articleImage = post.image
    ? `${SITE_URL}${post.image}`
    : `${SITE_URL}/og?title=${encodeURIComponent(post.title)}`;

  const articleJsonLd = buildJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: articleImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'AnglerPass',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AnglerPass',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: `${SITE_URL}/learn/${post.slug}`,
  });

  const breadcrumbJsonLd = buildJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Learn',
        item: `${SITE_URL}/learn`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${SITE_URL}/learn/${post.slug}`,
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />

      {/* Header */}
      <section className="bg-forest-deep pt-[140px] pb-16">
        <div className="max-w-[720px] mx-auto px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 text-[12px] text-parchment/40"
          >
            <Link href="/" className="hover:text-parchment/60 no-underline">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/learn"
              className="hover:text-parchment/60 no-underline"
            >
              Learn
            </Link>
            <span className="mx-2">/</span>
            <span className="text-parchment/60">{post.title}</span>
          </nav>

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-bronze-light bg-bronze/10 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="font-heading text-[clamp(32px,4.5vw,48px)] font-medium leading-[1.15] text-parchment tracking-[-0.5px] mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-[13px] text-parchment/40">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            <span>&middot;</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      {post.image && (
        <section className="bg-offwhite">
          <div className="max-w-[720px] mx-auto px-8 pt-10">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Direct Answer Block */}
      <section className="bg-offwhite py-8">
        <div className="max-w-[720px] mx-auto px-8">
          <div className="bg-bronze/5 border border-bronze/15 rounded-xl px-6 py-5">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-bronze mb-2">
              Quick Answer
            </p>
            <p className="text-[16px] leading-[1.7] text-forest font-medium m-0">
              {post.directAnswer}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-offwhite">
        <article
          className="max-w-[720px] mx-auto px-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </section>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="py-16 bg-parchment-light">
          <div className="max-w-[720px] mx-auto px-8">
            <h2 className="font-heading text-[24px] font-semibold text-forest mb-6">
              Related Articles
            </h2>
            <div className="marketing-grid-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/learn/${r.slug}`}
                  className="group bg-white border border-parchment rounded-xl overflow-hidden no-underline hover:border-bronze/30 transition-colors"
                >
                  {r.image && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={r.image}
                        alt={r.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="px-5 py-5">
                    <h3 className="font-heading text-[16px] font-semibold text-forest mb-1 group-hover:text-forest-deep transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-[13px] text-text-light m-0">
                      {r.readingTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-offwhite text-center">
        <div className="max-w-[500px] mx-auto px-8">
          <h2 className="font-heading text-[24px] font-medium text-forest mb-3">
            Ready to fish private water?
          </h2>
          <p className="text-[14px] text-text-secondary mb-6">
            AnglerPass connects fly anglers with exclusive private water through
            trusted clubs.
          </p>
          <Link
            href="/anglers"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
          >
            Explore AnglerPass for Anglers
          </Link>
        </div>
      </section>
    </>
  );
}
