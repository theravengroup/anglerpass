import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGES_SEO } from '@/lib/seo';

export const metadata: Metadata = PAGES_SEO.pricing;

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(154,115,64,0.1),_transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Pricing
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Transparent Pricing,<br />No Surprises.
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto">
            We believe in clear, honest pricing. Here&rsquo;s exactly what each
            participant in the AnglerPass ecosystem pays.
          </p>
        </div>
      </section>

      {/* For Clubs */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-river">
              For Clubs
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              Platform subscription + pass-through processing
            </h2>
            <p className="text-[16px] text-text-secondary leading-[1.65] max-w-[680px]">
              Your monthly subscription covers the AnglerPass platform. You set your own
              initiation fees and annual dues &mdash; we handle payment collection, billing,
              and payouts so you don&rsquo;t have to.
            </p>
          </div>

          {/* Subscription tiers */}
          <div className="marketing-features-grid grid grid-cols-3 gap-6 mb-10">
            {[
              { name: 'Starter', price: '$79', members: '100', properties: '10' },
              { name: 'Standard', price: '$199', members: '500', properties: '50', highlight: true },
              { name: 'Pro', price: '$499', members: 'Unlimited', properties: 'Unlimited' },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`reveal bg-white rounded-[14px] px-6 py-7 text-center ${tier.highlight ? 'border-2 border-river' : 'border border-parchment'}`}
              >
                <h3 className="font-heading text-[20px] font-semibold text-forest mb-1">
                  {tier.name}
                </h3>
                <div className="mb-2">
                  <span className="font-heading text-[32px] font-semibold text-forest">
                    {tier.price}
                  </span>
                  <span className="text-[14px] text-text-light">/month</span>
                </div>
                <p className="text-[13px] text-text-secondary m-0">
                  Up to {tier.members} members &middot; {tier.properties} properties
                </p>
              </div>
            ))}
          </div>

          {/* Processing fee callout */}
          <div className="reveal bg-white border border-parchment rounded-[14px] py-8 px-7">
            <h3 className="font-heading text-[22px] font-semibold text-forest mb-4 tracking-[-0.2px]">
              Membership payment processing
            </h3>
            <div className="marketing-features-grid grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[14px] font-semibold text-forest mb-2">
                  What clubs set
                </h4>
                <ul className="list-none m-0 p-0">
                  {[
                    'Initiation fee (one-time, for new members)',
                    'Annual dues (auto-renews yearly)',
                    'Both amounts are fully customizable',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 py-[5px] text-[14px] text-text-secondary leading-[1.5]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-river)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-forest mb-2">
                  What members pay at checkout
                </h4>
                <ul className="list-none m-0 p-0">
                  {[
                    'Club\'s stated fee (goes 100% to the club)',
                    '+ 3.5% processing fee (covers payment processing)',
                    'Total shown clearly before payment',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 py-[5px] text-[14px] text-text-secondary leading-[1.5]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-river)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Example */}
            <div className="mt-6 py-5 px-6 bg-offwhite rounded-[10px] border border-parchment">
              <p className="text-[13px] font-semibold text-forest mb-2">
                Example: A club with a $350 initiation fee and $175 annual dues
              </p>
              <div className="marketing-features-grid grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] text-text-secondary mb-1">
                    New member pays at joining:
                  </p>
                  <p className="text-[13px] text-text-secondary m-0 pl-4">
                    $350.00 initiation + $12.25 processing<br />
                    $175.00 first year dues + $6.13 processing<br />
                    <strong className="text-forest">Total: $543.38</strong>
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-text-secondary mb-1">
                    Club receives:
                  </p>
                  <p className="text-[13px] text-text-secondary m-0 pl-4">
                    $350.00 initiation fee<br />
                    $175.00 annual dues<br />
                    <strong className="text-forest">Total: $525.00 (100% of stated fees)</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Club Network Revenue */}
          <div className="reveal mt-8 bg-white border border-parchment rounded-[14px] py-8 px-7">
            <h3 className="font-heading text-[22px] font-semibold text-forest mb-4 tracking-[-0.2px]">
              Cross-Club Network revenue
            </h3>
            <p className="text-[14px] text-text-secondary leading-[1.65] mb-3">
              When your members fish at another club&rsquo;s properties, the angler pays
              a <strong className="text-forest">$25/rod cross-club access fee</strong>. Your club
              earns a $5 referral on every rod &mdash; passive revenue just for being in the network.
            </p>
            <p className="text-[13px] text-text-light leading-[1.6] mb-5">
              All tiers include cross-club access: Starter clubs can hold up to 2 partner
              agreements, Standard up to 10, and Pro clubs get unlimited agreements.
            </p>

            {/* Fee split visual */}
            <div className="mb-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text-light mb-3">
                How the $25 cross-club fee is split
              </p>
              <div className="flex rounded-[10px] overflow-hidden border border-parchment">
                <div className="flex-[4] bg-forest/5 px-5 py-4 border-r border-parchment">
                  <p className="text-[22px] font-heading font-semibold text-forest mb-0.5">$20</p>
                  <p className="text-[12px] text-text-secondary m-0">to AnglerPass</p>
                  <p className="text-[11px] text-text-light m-0 mt-0.5">Platform &amp; network operations</p>
                </div>
                <div className="flex-[1] bg-river/5 px-5 py-4">
                  <p className="text-[22px] font-heading font-semibold text-river mb-0.5">$5</p>
                  <p className="text-[12px] text-text-secondary m-0">to home club</p>
                  <p className="text-[11px] text-text-light m-0 mt-0.5">Member referral</p>
                </div>
              </div>
              <p className="text-[13px] text-text-secondary mt-2">
                The hosting club still receives its standard $5/rod commission from the rod fee &mdash; same as any booking.
              </p>
            </div>

            {/* Example */}
            <div className="py-5 px-6 bg-offwhite rounded-[10px] border border-parchment">
              <p className="text-[13px] font-semibold text-forest mb-3">
                Example: Your member books 2 rods for 3 days at a partner club&rsquo;s water
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[13px] pb-2 border-b border-parchment">
                  <span className="text-text-secondary">Cross-club fee: $25/rod &times; 2 rods &times; 3 days</span>
                  <span className="font-medium text-forest">$150</span>
                </div>
                <div className="flex justify-between text-[13px] mt-2">
                  <span className="text-forest">AnglerPass receives ($20 &times; 6)</span>
                  <span className="text-text-secondary">$120</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-river font-medium">Your club receives ($5 &times; 6)</span>
                  <span className="font-semibold text-river">$30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Anglers */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal mb-12">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
              For Anglers
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              What anglers pay
            </h2>
            <p className="text-[16px] text-text-secondary leading-[1.65] max-w-[680px]">
              No AnglerPass subscription required. You pay for club membership and fishing
              access &mdash; that&rsquo;s it.
            </p>
          </div>

          <div className="marketing-features-grid grid grid-cols-2 gap-6">
            {/* Membership fees */}
            <div className="reveal d1 bg-white border border-parchment rounded-[14px] py-8 px-7">
              <h3 className="font-heading text-[20px] font-semibold text-forest mb-4">
                Club membership
              </h3>
              <ul className="list-none m-0 p-0">
                {[
                  { label: 'Initiation fee', detail: 'One-time, set by your club' },
                  { label: 'Annual dues', detail: 'Yearly, auto-renews' },
                  { label: 'Processing fee', detail: '3.5% added at checkout' },
                ].map((item) => (
                  <li key={item.label} className="py-2 border-b border-parchment">
                    <span className="text-[14px] font-medium text-forest">{item.label}</span>
                    <span className="text-[13px] text-text-light ml-2">&mdash; {item.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-text-light mt-4 leading-[1.6]">
                Membership amounts vary by club. You&rsquo;ll see the full breakdown
                before you pay.
              </p>
            </div>

            {/* Booking fees */}
            <div className="reveal d2 bg-white border border-parchment rounded-[14px] py-8 px-7">
              <h3 className="font-heading text-[20px] font-semibold text-forest mb-4">
                Fishing access
              </h3>
              <ul className="list-none m-0 p-0">
                {[
                  { label: 'Rod fee', detail: 'Per rod, per day, set by the property' },
                  { label: 'Platform fee', detail: '15% of rod fees' },
                  { label: 'Cross-club access fee', detail: '$25/rod (only when fishing outside your home club)' },
                  { label: 'Guide service fee', detail: '10% of guide rate (only when adding a guide)' },
                ].map((item) => (
                  <li key={item.label} className="py-2 border-b border-parchment">
                    <span className="text-[14px] font-medium text-forest">{item.label}</span>
                    <span className="text-[13px] text-text-light ml-2">&mdash; {item.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-text-light mt-4 leading-[1.6]">
                Non-fishing guests are free. Only anglers with rods pay the rod fee.
                The $25 cross-club fee is split $20 to AnglerPass and $5 to your
                home club. The hosting club receives its standard $5/rod commission
                from the rod fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Landowners */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal mb-12">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-forest">
              For Landowners
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              What landowners receive
            </h2>
            <p className="text-[16px] text-text-secondary leading-[1.65] max-w-[680px]">
              No subscription fees. No upfront costs. You set your rod rate, and you get paid
              when people fish your water.
            </p>
          </div>

          <div className="reveal bg-white border border-parchment rounded-[14px] py-8 px-7">
            <h3 className="font-heading text-[20px] font-semibold text-forest mb-5">
              Per-booking payout breakdown
            </h3>
            <div className="flex flex-col">
              {[
                { label: 'Rod rate (set by you)', example: 'e.g. $75/rod/day', color: 'text-forest' },
                { label: 'Club commission', example: '$5/rod (goes to the managing club)', color: 'text-text-secondary' },
                { label: 'Your payout', example: 'Rod rate minus $5/rod club commission', color: 'text-forest', bold: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-[14px] border-b border-parchment"
                >
                  <span className={`text-[14px] ${row.bold ? 'font-semibold' : 'font-normal'} ${row.color}`}>
                    {row.label}
                  </span>
                  <span className="text-[13px] text-text-light">
                    {row.example}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-text-light mt-4 leading-[1.6]">
              Platform fees and cross-club access fees are paid by the angler and do not
              reduce your payout. The $5/rod club commission is the only deduction from your rate.
            </p>
          </div>
        </div>
      </section>

      {/* For Guides */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal mb-12">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-charcoal">
              For Guides
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              What guides receive
            </h2>
            <p className="text-[16px] text-text-secondary leading-[1.65] max-w-[680px]">
              No subscription. No listing fee. You set your rates and keep 100% of them.
              The angler pays a 10% service fee on top &mdash; it never comes out of your pocket.
            </p>
          </div>

          <div className="reveal bg-white border border-parchment rounded-[14px] py-8 px-7">
            <h3 className="font-heading text-[20px] font-semibold text-forest mb-5">
              Per-trip payout breakdown
            </h3>
            <div className="flex flex-col">
              {[
                { label: 'Your full-day rate (set by you)', example: 'e.g. $500', color: 'text-forest' },
                { label: '10% service fee', example: 'e.g. +$50 (paid by the angler)', color: 'text-text-secondary' },
                { label: 'Angler pays at checkout', example: 'e.g. $550 (your rate + service fee)', color: 'text-text-secondary' },
                { label: 'You receive', example: '$500 (100% of your rate)', color: 'text-forest', bold: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-[14px] border-b border-parchment"
                >
                  <span className={`text-[14px] ${row.bold ? 'font-semibold' : 'font-normal'} ${row.color}`}>
                    {row.label}
                  </span>
                  <span className="text-[13px] text-text-light">
                    {row.example}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-text-light mt-4 leading-[1.6]">
              Guide add-on is optional for anglers. When an angler selects you for their trip,
              the service fee is added to their checkout total. You also set a half-day rate
              separately. Payouts are processed via{' '}
              <Link href="/guides" className="text-charcoal underline">
                Stripe Connect
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* How money flows */}
      <section className="py-20 bg-offwhite">
        <div className="reveal max-w-[700px] mx-auto px-8 text-center">
          <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze">
            Payment Processing
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-5 tracking-[-0.3px]">
            Powered by Stripe
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-text-secondary max-w-[560px] mx-auto mb-3">
            All payments are processed securely through Stripe. Members can manage their
            payment methods, view billing history, and update their credit card or bank
            account at any time through their account settings.
          </p>
          <p className="text-[14px] leading-[1.7] text-text-light max-w-[500px] mx-auto">
            Annual dues auto-renew each year. You&rsquo;ll receive a reminder before renewal,
            and you can cancel anytime from your membership settings. See our{' '}
            <Link href="/policies" className="text-river underline">
              policies page
            </Link>{' '}
            for details on renewals and grace periods.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[120px] bg-forest-deep text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px] text-balance">
            Ready to get started?
          </h2>
          <p className="text-[16px] text-parchment/50 max-w-[440px] mx-auto mb-10 leading-[1.7]">
            Join the waitlist and be among the first to access AnglerPass when
            we launch.
          </p>
          <div className="flex gap-[14px] justify-center flex-wrap">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-[14px] font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              Join the Waitlist
            </Link>
            <Link
              href="/policies"
              className="inline-flex items-center gap-2 px-[34px] py-4 rounded-md text-[14px] font-medium tracking-[0.3px] no-underline bg-transparent text-parchment border border-parchment/20 transition-all duration-[400ms]"
            >
              View Policies
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
