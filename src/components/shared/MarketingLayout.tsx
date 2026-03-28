import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen">{children}</main>
      <MarketingFooter />
    </>
  );
}
