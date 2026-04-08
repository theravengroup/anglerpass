import type { Metadata } from 'next';

export const SITE_URL = 'https://anglerpass.com';
export const SITE_NAME = 'AnglerPass';
export const DEFAULT_TITLE = 'AnglerPass — Private Water Fly Fishing Access';
export const DEFAULT_DESCRIPTION =
  'AnglerPass connects fly anglers with private water properties through trusted clubs. Book exclusive access to private trout streams, rivers, and lakes.';
export const DEFAULT_OG_IMAGE = '/og/anglerpass-default.jpg';

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image,
  keywords = [],
}: BuildMetadataOptions = {}): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image
    ? image
    : `${SITE_URL}/og?title=${encodeURIComponent(title ?? SITE_NAME)}`;

  return {
    title: title ?? DEFAULT_TITLE,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      title: title ?? DEFAULT_TITLE,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? DEFAULT_TITLE,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function buildJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

/** Pre-built metadata configs for static marketing pages */
export const PAGES_SEO = {
  home: buildMetadata({
    title: 'Book Private Water Fly Fishing | Club Management Platform',
    description:
      'AnglerPass connects fly anglers with exclusive private water access through trusted fishing clubs. Find and book private trout streams, rivers, and ranches. Club management tools for fly fishing organizations.',
    path: '',
    keywords: [
      'private water fly fishing',
      'fly fishing private access',
      'book private fly fishing',
      'fly fishing club management',
      'private trout stream booking',
      'exclusive fly fishing access',
      'anglerpass',
    ],
  }),
  anglers: buildMetadata({
    title: 'Private Fly Fishing Access for Anglers | Exclusive Water Booking',
    description:
      "Join a fly fishing club on AnglerPass and book exclusive access to private trout streams, rivers, and ranch ponds. Escape public water crowds. Fish where others can't.",
    path: '/anglers',
    keywords: [
      'book private fly fishing',
      'private water fly fishing access',
      'exclusive fly fishing',
      'private trout stream',
      'fly fishing club membership',
      'private fly fishing near me',
      'private ranch fishing',
    ],
  }),
  clubs: buildMetadata({
    title: 'Fly Fishing Club Management Software | AnglerPass for Clubs',
    description:
      'AnglerPass gives fly fishing clubs tools to manage memberships, dues, corporate members, and private water property bookings — all in one platform. Grow your club. Earn from your water.',
    path: '/clubs',
    keywords: [
      'fly fishing club management software',
      'fly fishing club platform',
      'fishing club membership management',
      'fly fishing club software',
      'manage fly fishing club',
      'private water club management',
    ],
  }),
  landowners: buildMetadata({
    title:
      'List Your Private Water for Fly Fishing | AnglerPass for Landowners',
    description:
      'Generate income from your private streams, rivers, and ponds. Partner with a fly fishing club on AnglerPass to manage bookings, vet anglers, and protect your property.',
    path: '/landowners',
    keywords: [
      'lease land for fly fishing',
      'allow fishing on private property',
      'monetize private fishing water',
      'private water fishing income',
      'fly fishing land lease',
      'landowner fishing access platform',
      'private fishing property management',
    ],
  }),
  about: buildMetadata({
    title: 'About AnglerPass | The Private Water Fly Fishing Platform',
    description:
      'AnglerPass is the only platform that connects fly anglers, fly fishing clubs, and private landowners in a single marketplace for private water access.',
    path: '/about',
    keywords: [
      'about anglerpass',
      'private water fly fishing platform',
      'fly fishing marketplace',
    ],
  }),
  pricing: buildMetadata({
    title: 'Pricing — AnglerPass',
    description:
      'Transparent pricing for clubs, landowners, anglers, and guides. See exactly what you pay and what you receive on AnglerPass.',
    path: '/pricing',
    keywords: [
      'fly fishing club pricing',
      'private water fishing cost',
      'anglerpass pricing',
      'fly fishing booking fees',
    ],
  }),
  press: buildMetadata({
    title: 'Press | AnglerPass — Private Water Fly Fishing Marketplace',
    description:
      'Press resources, media kit, and company information for AnglerPass — the first marketplace connecting anglers, fly fishing clubs, private water landowners, and guides.',
    path: '/press',
    keywords: [
      'anglerpass press',
      'anglerpass media kit',
      'private water fly fishing press release',
      'fly fishing marketplace news',
    ],
  }),
} as const;

/** Internal linking map — topics to their canonical pages */
export const INTERNAL_LINKS: Record<string, string> = {
  'private water access': '/anglers',
  'club management': '/clubs',
  'landowner income': '/landowners',
  'how it works': '/',
  pricing: '/pricing',
  about: '/about',
  press: '/press',
  learn: '/learn',
  // State pages
  montana: '/fly-fishing/montana',
  colorado: '/fly-fishing/colorado',
  wyoming: '/fly-fishing/wyoming',
  idaho: '/fly-fishing/idaho',
  oregon: '/fly-fishing/oregon',
  washington: '/fly-fishing/washington',
  virginia: '/fly-fishing/virginia',
  pennsylvania: '/fly-fishing/pennsylvania',
  'north carolina': '/fly-fishing/north-carolina',
  tennessee: '/fly-fishing/tennessee',
  utah: '/fly-fishing/utah',
  'new york': '/fly-fishing/new-york',
  // Blog posts
  'private water access guide': '/learn/how-to-get-access-to-private-fly-fishing-water',
  'what is a fly fishing club': '/learn/what-is-a-fly-fishing-club',
  'private vs public water': '/learn/private-vs-public-water-fly-fishing',
  'club water management': '/learn/how-fly-fishing-clubs-manage-private-water-access',
  'landowner fishing income': '/learn/how-landowners-can-earn-income-from-fly-fishing-access',
  'best private trout streams': '/learn/best-private-trout-streams-american-west',
  'cross-club access': '/learn/what-is-cross-club-fly-fishing-access',
  'start a fly fishing club': '/learn/how-to-start-a-fly-fishing-club',
};
