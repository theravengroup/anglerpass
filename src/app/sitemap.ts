import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { STATE_SEO_DATA } from '@/lib/state-seo-data';
import { getAllPosts } from '@/lib/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${SITE_URL}/anglers`, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${SITE_URL}/clubs`, changeFrequency: 'monthly', priority: 1.0 },
    {
      url: `${SITE_URL}/landowners`,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/pricing`, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/learn`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  // State pages
  const statePages: MetadataRoute.Sitemap = STATE_SEO_DATA.map((state) => ({
    url: `${SITE_URL}/fly-fishing/${state.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Blog posts
  const posts = getAllPosts();
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/learn/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
  }));

  // Dynamic property and club pages (query Supabase when tables are populated)
  // Uncomment when properties/clubs have public slug-based pages:
  // const supabase = await createClient();
  // const { data: properties } = await supabase
  //   .from('properties')
  //   .select('slug, updated_at')
  //   .eq('status', 'published');
  // const propertyPages = (properties ?? []).map((p) => ({
  //   url: `${SITE_URL}/properties/${p.slug}`,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.8,
  //   lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
  // }));
  // const { data: clubs } = await supabase
  //   .from('clubs')
  //   .select('slug, updated_at')
  //   .eq('status', 'active');
  // const clubPages = (clubs ?? []).map((c) => ({
  //   url: `${SITE_URL}/clubs/${c.slug}`,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  //   lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
  // }));

  return [...staticPages, ...statePages, ...postPages];
}
