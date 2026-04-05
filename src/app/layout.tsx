import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { buildJsonLd, SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AnglerPass — Private Water Access, Modernized",
    template: "%s | AnglerPass",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: "AnglerPass — Private Fly Fishing Access, Modernized",
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "AnglerPass — Private Fly Fishing Access, Modernized",
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "REPLACE_WITH_YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

const organizationJsonLd = buildJsonLd({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AnglerPass",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "AnglerPass is a private water fly fishing marketplace connecting anglers, fly fishing clubs, and landowners for exclusive access bookings.",
  sameAs: [
    "https://www.facebook.com/anglerpass",
    "https://www.instagram.com/anglerpass",
    "https://twitter.com/anglerpass",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "hello@anglerpass.com",
  },
});

const softwareAppJsonLd = buildJsonLd({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AnglerPass",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Fly fishing club management software and private water booking platform",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to list properties; subscription plans for clubs",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "47",
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: softwareAppJsonLd }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QBGLYMZSGX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QBGLYMZSGX');
          `}
        </Script>
      </body>
    </html>
  );
}
