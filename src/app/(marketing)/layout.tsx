import './homepage.css';
import ScrollRevealProvider from '@/components/homepage/ScrollRevealProvider';
import Nav from '@/components/homepage/Nav';
import MarketingFooter from '@/components/shared/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollRevealProvider>
      <Nav />
      {children}
      <MarketingFooter />
    </ScrollRevealProvider>
  );
}
