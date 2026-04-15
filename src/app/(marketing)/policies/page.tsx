import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyContent from '@/components/policies/PolicyContent';

export const metadata: Metadata = {
  title: 'Policies — AnglerPass',
  description:
    'Platform policies for AnglerPass: membership terms, cancellation policy, refund schedule, renewal grace periods, and booking rules.',
  openGraph: {
    title: 'Policies — AnglerPass',
    description:
      'Platform policies for membership, cancellations, refunds, and renewals on AnglerPass.',
  },
};

const TOC_ITEMS = [
  { href: '#membership', label: 'Membership & Applications' },
  { href: '#dues', label: 'Dues & Renewals' },
  { href: '#cancellations', label: 'Membership Cancellations' },
  { href: '#removals', label: 'Club-Initiated Removal' },
  { href: '#rejoining', label: 'Rejoining a Club' },
  { href: '#payments', label: 'Payment Processing' },
  { href: '#bookings', label: 'Booking Cancellations & Refunds' },
  { href: '#payouts', label: 'Payout Schedules' },
  { href: '#guide-services', label: 'Independent Guide Services' },
  { href: '#guest-policy', label: 'Guest Policy' },
  { href: '#club-subscriptions', label: 'Club Subscriptions' },
  { href: '#sms-terms', label: 'SMS Terms & Conditions' },
  { href: '#review-moderation', label: 'Review Moderation' },
];

export default function PoliciesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(154,115,64,0.1),_transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Policies
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Platform Policies
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto">
            Clear rules for memberships, bookings, cancellations, and payments.
            Last updated April 2026.
          </p>
        </div>
      </section>

      {/* Content with sidebar TOC */}
      <section className="py-16 bg-offwhite lg:py-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">

            {/* Sidebar TOC — uses div not nav to avoid homepage.css nav{} styles */}
            <aside className="hidden lg:block">
              <div className="sticky top-[96px]" role="navigation" aria-label="Table of contents">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-light mb-4">
                  On this page
                </h2>
                <ul className="list-none m-0 p-0 border-l border-parchment">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="block py-1.5 pl-4 -ml-px text-[13px] text-text-secondary no-underline border-l border-transparent transition-colors duration-200 hover:text-forest hover:border-forest"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main content */}
            <div>
              {/* Mobile TOC — collapsible card */}
              <details className="lg:hidden mb-10 group">
                <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-parchment bg-white px-5 py-3.5 text-[14px] font-medium text-forest">
                  On this page
                  <svg
                    className="size-4 text-text-light transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <ul className="list-none m-0 mt-2 p-0 rounded-lg border border-parchment bg-white px-5 py-3">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="block py-1.5 text-[13px] text-river no-underline"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>

              <PolicyContent />

              {/* Footer link */}
              <div className="mt-12 pt-8 border-t border-parchment">
                <p className="text-[14px] text-text-light">
                  For a breakdown of what each participant pays, see our{' '}
                  <Link href="/pricing" className="text-river underline">
                    pricing page
                  </Link>.
                  See also our{' '}
                  <Link href="/terms" className="text-river underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-river underline">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
