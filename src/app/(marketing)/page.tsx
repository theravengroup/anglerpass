import HeroSection from '@/components/homepage/HeroSection';
import ProblemSection from '@/components/homepage/ProblemSection';
import CinematicDivider from '@/components/homepage/CinematicDivider';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import CompassSection from '@/components/homepage/CompassSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import WhySection from '@/components/homepage/WhySection';
import BuiltForSection from '@/components/homepage/BuiltForSection';
import WaitlistSection from '@/components/homepage/WaitlistSection';
import FaqSection from '@/components/homepage/FaqSection';
import InvestorsSection from '@/components/homepage/InvestorsSection';
import FinalCtaSection from '@/components/homepage/FinalCtaSection';
import FloatingCta from '@/components/homepage/FloatingCta';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <CinematicDivider />
      <HowItWorksSection />
      <CompassSection />
      <FeaturesSection />
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
