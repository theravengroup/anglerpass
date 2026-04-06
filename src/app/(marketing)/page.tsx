import type { Metadata } from 'next';
import HeroSection from '@/components/homepage/HeroSection';
import ProblemSection from '@/components/homepage/ProblemSection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import CompassSection from '@/components/homepage/CompassSection';
import WhySection from '@/components/homepage/WhySection';
import BuiltForSection from '@/components/homepage/BuiltForSection';
import WaitlistSection from '@/components/homepage/WaitlistSection';
import FaqSection from '@/components/homepage/FaqSection';
import InvestorsSection from '@/components/homepage/InvestorsSection';
import FinalCtaSection from '@/components/homepage/FinalCtaSection';
import FloatingCta from '@/components/homepage/FloatingCta';
import { PAGES_SEO, buildJsonLd, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  ...PAGES_SEO.home,
  alternates: { canonical: SITE_URL },
};

const faqJsonLd = buildJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is AnglerPass?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AnglerPass is a fly fishing marketplace and club management platform that connects anglers, fly fishing clubs, and private landowners for private water access booking.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get access to private fly fishing water?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Through AnglerPass, you join a member fly fishing club that manages private water properties. Once a member, you can book access to any property on the AnglerPass network, including properties managed by other clubs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I book private fly fishing water without a guide?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. AnglerPass enables unguided, self-directed private water access bookings through member fly fishing clubs.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AnglerPass differ from FishingBooker or other booking platforms?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AnglerPass focuses exclusively on private, unguided water access managed through fly fishing clubs. It is not a guide service marketplace — it is a private water access platform where clubs serve as the trust layer between landowners and anglers.',
      },
    },
  ],
});

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd }}
      />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CompassSection />
      <WhySection />
      <BuiltForSection />
      <WaitlistSection />
      <FaqSection />
      <InvestorsSection />
      <FinalCtaSection />
      <FloatingCta />
    </>
  );
}
