import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/posts';
import { buildMetadata } from '@/lib/seo';
import LearnPostGrid from '@/components/shared/LearnPostGrid';

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: 'Fly Fishing Independent Guides & Resources | AnglerPass Learn',
  description:
    'Expert independent guides on private water fly fishing, club management, and access rights. Learn everything about fly fishing on private land.',
  path: '/learn',
  keywords: [
    'fly fishing independent guides',
    'private water fly fishing',
    'fly fishing club resources',
    'private water access guide',
  ],
});

export default function LearnPage() {
  const posts = getPublishedPosts();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[80px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(154,115,64,0.1),transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Learn
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,52px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Fly Fishing Independent Guides &amp; Resources
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto">
            Expert independent guides on private water access, club management, and getting
            the most out of your fly fishing experience.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-[80px] bg-offwhite">
        <div className="max-w-[1000px] mx-auto px-8">
          {posts.length === 0 ? (
            <p className="text-center text-text-secondary">
              No posts yet. Check back soon.
            </p>
          ) : (
            <LearnPostGrid posts={posts} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-parchment-light text-center">
        <div className="max-w-[700px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(24px,3vw,32px)] font-medium text-forest mb-4">
            Ready to get started?
          </h2>
          <p className="text-[15px] text-text-secondary mb-10">
            AnglerPass is the operating platform for private fly fishing access.
            Find out how it works for your role.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/anglers"
              className="inline-flex items-center justify-center px-5 py-3.5 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-300 hover:opacity-90"
            >
              Anglers
            </Link>
            <Link
              href="/clubs"
              className="inline-flex items-center justify-center px-5 py-3.5 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-river text-white transition-all duration-300 hover:opacity-90"
            >
              Clubs
            </Link>
            <Link
              href="/landowners"
              className="inline-flex items-center justify-center px-5 py-3.5 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-forest text-white transition-all duration-300 hover:opacity-90"
            >
              Landowners
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center justify-center px-5 py-3.5 rounded-md text-sm font-medium tracking-[0.3px] no-underline bg-charcoal text-white transition-all duration-300 hover:opacity-90"
            >
              Independent Guides
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
