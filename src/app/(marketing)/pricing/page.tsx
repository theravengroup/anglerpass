import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — AnglerPass',
  description:
    'Transparent pricing for clubs, landowners, and anglers. See exactly what you pay and what you receive on AnglerPass.',
  openGraph: {
    title: 'Pricing — AnglerPass',
    description:
      'Transparent pricing for clubs, landowners, and anglers on AnglerPass.',
  },
};

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-forest-deep)',
          padding: '160px 0 100px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at bottom left, rgba(154,115,64,0.1), transparent 60%)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              marginBottom: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'var(--color-bronze-light)',
            }}
          >
            Pricing
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(38px, 5vw, 58px)',
              fontWeight: 500,
              lineHeight: 1.1,
              color: 'var(--color-parchment)',
              letterSpacing: '-.5px',
              margin: '0 0 24px',
            }}
          >
            Transparent Pricing,<br />No Surprises.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(240,234,214,.6)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            We believe in clear, honest pricing. Here&rsquo;s exactly what each
            participant in the AnglerPass ecosystem pays.
          </p>
        </div>
      </section>

      {/* For Clubs */}
      <section style={{ padding: '100px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-river)',
              }}
            >
              For Clubs
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                fontWeight: 500,
                color: 'var(--color-forest)',
                margin: '0 0 16px',
                letterSpacing: '-.3px',
              }}
            >
              Platform subscription + pass-through processing
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: 680 }}>
              Your monthly subscription covers the AnglerPass platform. You set your own
              initiation fees and annual dues &mdash; we handle payment collection, billing,
              and payouts so you don&rsquo;t have to.
            </p>
          </div>

          {/* Subscription tiers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              marginBottom: 40,
            }}
            className="marketing-features-grid"
          >
            {[
              { name: 'Starter', price: '$149', members: '500', properties: '25' },
              { name: 'Standard', price: '$349', members: '2,000', properties: '100', highlight: true },
              { name: 'Pro', price: '$699', members: 'Unlimited', properties: 'Unlimited' },
            ].map((tier) => (
              <div
                key={tier.name}
                className="reveal"
                style={{
                  background: '#fff',
                  border: tier.highlight ? '2px solid var(--color-river)' : '1px solid var(--color-parchment)',
                  borderRadius: 14,
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 600, color: 'var(--color-forest)', marginBottom: 4 }}>
                  {tier.name}
                </h3>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 600, color: 'var(--color-forest)' }}>
                    {tier.price}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--color-text-light)' }}>/month</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Up to {tier.members} members &middot; {tier.properties} properties
                </p>
              </div>
            ))}
          </div>

          {/* Processing fee callout */}
          <div
            className="reveal"
            style={{
              background: '#fff',
              border: '1px solid var(--color-parchment)',
              borderRadius: 14,
              padding: '32px 28px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--color-forest)',
                marginBottom: 16,
                letterSpacing: '-.2px',
              }}
            >
              Membership payment processing
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
              }}
              className="marketing-features-grid"
            >
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-forest)', marginBottom: 8 }}>
                  What clubs set
                </h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {[
                    'Initiation fee (one-time, for new members)',
                    'Annual dues (auto-renews yearly)',
                    'Both amounts are fully customizable',
                  ].map((item) => (
                    <li
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '5px 0',
                        fontSize: 14,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-river)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 3, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-forest)', marginBottom: 8 }}>
                  What members pay at checkout
                </h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {[
                    'Club\'s stated fee (goes 100% to the club)',
                    '+ 3.5% processing fee (covers payment processing)',
                    'Total shown clearly before payment',
                  ].map((item) => (
                    <li
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '5px 0',
                        fontSize: 14,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-river)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 3, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Example */}
            <div
              style={{
                marginTop: 24,
                padding: '20px 24px',
                background: 'var(--color-offwhite)',
                borderRadius: 10,
                border: '1px solid var(--color-parchment)',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-forest)', marginBottom: 8 }}>
                Example: A club with a $350 initiation fee and $175 annual dues
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="marketing-features-grid">
                <div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
                    New member pays at joining:
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 16 }}>
                    $350.00 initiation + $12.25 processing<br />
                    $175.00 first year dues + $6.13 processing<br />
                    <strong style={{ color: 'var(--color-forest)' }}>Total: $543.38</strong>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
                    Club receives:
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 16 }}>
                    $350.00 initiation fee<br />
                    $175.00 annual dues<br />
                    <strong style={{ color: 'var(--color-forest)' }}>Total: $525.00 (100% of stated fees)</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Anglers */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-bronze)',
              }}
            >
              For Anglers
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                fontWeight: 500,
                color: 'var(--color-forest)',
                margin: '0 0 16px',
                letterSpacing: '-.3px',
              }}
            >
              What anglers pay
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: 680 }}>
              No AnglerPass subscription required. You pay for club membership and fishing
              access &mdash; that&rsquo;s it.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 24,
            }}
            className="marketing-features-grid"
          >
            {/* Membership fees */}
            <div
              className="reveal d1"
              style={{
                background: '#fff',
                border: '1px solid var(--color-parchment)',
                borderRadius: 14,
                padding: '32px 28px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--color-forest)',
                  marginBottom: 16,
                }}
              >
                Club membership
              </h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[
                  { label: 'Initiation fee', detail: 'One-time, set by your club' },
                  { label: 'Annual dues', detail: 'Yearly, auto-renews' },
                  { label: 'Processing fee', detail: '3.5% added at checkout' },
                ].map((item) => (
                  <li key={item.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-parchment)' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-forest)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-light)', marginLeft: 8 }}>&mdash; {item.detail}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 13, color: 'var(--color-text-light)', marginTop: 16, lineHeight: 1.6 }}>
                Membership amounts vary by club. You&rsquo;ll see the full breakdown
                before you pay.
              </p>
            </div>

            {/* Booking fees */}
            <div
              className="reveal d2"
              style={{
                background: '#fff',
                border: '1px solid var(--color-parchment)',
                borderRadius: 14,
                padding: '32px 28px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--color-forest)',
                  marginBottom: 16,
                }}
              >
                Fishing access
              </h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[
                  { label: 'Rod fee', detail: 'Per rod, per day, set by the property' },
                  { label: 'Platform fee', detail: '15% of rod fees' },
                  { label: 'Cross-club fee', detail: '$10/rod (only when fishing outside your home club)' },
                ].map((item) => (
                  <li key={item.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-parchment)' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-forest)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-light)', marginLeft: 8 }}>&mdash; {item.detail}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 13, color: 'var(--color-text-light)', marginTop: 16, lineHeight: 1.6 }}>
                Non-fishing guests are free. Only anglers with rods pay the rod fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Landowners */}
      <section style={{ padding: '100px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-forest)',
              }}
            >
              For Landowners
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                fontWeight: 500,
                color: 'var(--color-forest)',
                margin: '0 0 16px',
                letterSpacing: '-.3px',
              }}
            >
              What landowners receive
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: 680 }}>
              No subscription fees. No upfront costs. You set your rod rate, and you get paid
              when people fish your water.
            </p>
          </div>

          <div
            className="reveal"
            style={{
              background: '#fff',
              border: '1px solid var(--color-parchment)',
              borderRadius: 14,
              padding: '32px 28px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--color-forest)',
                marginBottom: 20,
              }}
            >
              Per-booking payout breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Rod rate (set by you)', example: 'e.g. $75/rod/day', color: 'var(--color-forest)' },
                { label: 'Club commission', example: '$5/rod (goes to the managing club)', color: 'var(--color-text-secondary)' },
                { label: 'Your payout', example: 'Rod rate minus $5/rod club commission', color: 'var(--color-forest)', bold: true },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--color-parchment)',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: row.bold ? 600 : 400, color: row.color }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-light)' }}>
                    {row.example}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-light)', marginTop: 16, lineHeight: 1.6 }}>
              Platform fees and cross-club fees are paid by the angler and do not reduce
              your payout. The $5/rod club commission is the only deduction from your rate.
            </p>
          </div>
        </div>
      </section>

      {/* How money flows */}
      <section style={{ padding: '80px 0', background: 'var(--color-parchment-light)' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              marginBottom: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'var(--color-bronze)',
            }}
          >
            Payment Processing
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 500,
              color: 'var(--color-forest)',
              margin: '0 0 20px',
              letterSpacing: '-.3px',
            }}
          >
            Powered by Stripe
          </h2>
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
              maxWidth: 560,
              margin: '0 auto 12px',
            }}
          >
            All payments are processed securely through Stripe. Members can manage their
            payment methods, view billing history, and update their credit card or bank
            account at any time through their account settings.
          </p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--color-text-light)',
              maxWidth: 500,
              margin: '0 auto',
            }}
          >
            Annual dues auto-renew each year. You&rsquo;ll receive a reminder before renewal,
            and you can cancel anytime from your membership settings. See our{' '}
            <Link href="/policies" style={{ color: 'var(--color-river)', textDecoration: 'underline' }}>
              policies page
            </Link>{' '}
            for details on renewals and grace periods.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '120px 0',
          background: 'var(--color-forest-deep)',
          textAlign: 'center',
        }}
      >
        <div className="reveal" style={{ maxWidth: 600, margin: '0 auto', padding: '0 32px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 500,
              color: 'var(--color-parchment)',
              margin: '0 0 16px',
              letterSpacing: '-.3px',
              textWrap: 'balance',
            }}
          >
            Ready to get started?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(240,234,214,.5)',
              maxWidth: 440,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            Join the waitlist and be among the first to access AnglerPass when
            we launch.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/#waitlist"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 40px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '.3px',
                textDecoration: 'none',
                background: 'var(--color-bronze)',
                color: '#fff',
                transition: 'all .4s',
              }}
            >
              Join the Waitlist
            </Link>
            <Link
              href="/policies"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 34px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '.3px',
                textDecoration: 'none',
                background: 'transparent',
                color: 'var(--color-parchment)',
                border: '1px solid rgba(240,234,214,.2)',
                transition: 'all .4s',
              }}
            >
              View Policies
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
