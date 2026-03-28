import './homepage.css';
import ScrollRevealProvider from '@/components/homepage/ScrollRevealProvider';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollRevealProvider>
      {children}
    </ScrollRevealProvider>
  );
}
