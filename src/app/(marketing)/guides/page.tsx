import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Guides — AnglerPass',
  description:
    'Guide on private water. Build your client base, manage availability, and earn more with AnglerPass — the platform for professional fly fishing guides.',
  openGraph: {
    title: 'For Guides — AnglerPass',
    description:
      'Guide on private water. Build your client base, manage availability, and earn more with AnglerPass.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Guides — AnglerPass',
    description:
      'Guide on private water. Build your client base, manage availability, and earn more with AnglerPass.',
  },
};

const features = [
  {
    title: 'Access Private Water',
    description:
      'Get approved to guide on exclusive club waters and private stretches that most guides never see. Build relationships with landowners and clubs through a trusted platform.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    title: 'Instant Bookings',
    description:
      'Anglers book you directly when they add a guide to their trip. No back-and-forth, no phone tag. Confirmed bookings land in your dashboard immediately.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Manage Your Calendar',
    description:
      'Set your availability with a visual calendar. Block off dates, see booked days at a glance, and stay in control of your schedule.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Build Your Reputation',
    description:
      'Earn reviews from anglers you guide. Your rating, specialties, and credentials are showcased when anglers browse available guides for their trip.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'In-App Messaging',
    description:
      'Communicate with anglers and club admins directly through the platform. Coordinate trip details, share local knowledge, and build client relationships.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    title: 'Track Your Earnings',
    description:
      'See your earnings in real time — this month, this year, all time. Clear breakdown of guide rates, service fees, and payouts.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Create Your Profile',
    description: 'Sign up, add your techniques, species specialties, location, and set your rates. Upload your guide license, insurance, and first aid certification.',
  },
  {
    step: '02',
    title: 'Get Verified',
    description: 'Our team reviews your credentials. Once approved, your profile is visible to anglers across the platform.',
  },
  {
    step: '03',
    title: 'Request Water Access',
    description: 'Browse available properties and request approval from clubs to guide on their waters. Build your network of approved locations.',
  },
  {
    step: '04',
    title: 'Get Booked',
    description: 'When anglers book a trip on water you\'re approved for, they can add you as their guide. You get notified instantly and the trip appears in your dashboard.',
  },
];

const requirements = [
  'Valid state guide license',
  'Professional liability insurance',
  'Current first aid certification',
  'Clean background (verified by AnglerPass)',
];

const faqs = [
  {
    q: 'How much does it cost to join as a guide?',
    a: 'There is no upfront cost or subscription fee. AnglerPass adds a 10% service fee on top of your guide rate, paid by the angler. You receive 100% of your stated rate.',
  },
  {
    q: 'How do I get approved for specific waters?',
    a: 'Once your profile is verified, you can request access to any property on the platform. The club or landowner managing that water reviews your credentials and decides whether to approve you.',
  },
  {
    q: 'Can I set my own rates?',
    a: 'Absolutely. You set your full-day and half-day rates. You can also adjust rates by property if needed.',
  },
  {
    q: 'How do I get paid?',
    a: 'Payouts are processed through Stripe Connect. After each completed trip, your guide rate is deposited directly to your bank account.',
  },
  {
    q: 'What if an angler cancels?',
    a: 'Our cancellation policy protects guides. Cancellations within 48 hours of the trip date result in a full payout to the guide. Earlier cancellations follow a tiered refund schedule.',
  },
  {
    q: 'Do I need to be affiliated with a club?',
    a: 'No. Guides are independent providers on AnglerPass. You request water access from clubs, but you\'re not bound to any single club.',
  },
];

export default function GuidesPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-charcoal)',
          padding: '160px 0 100px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at bottom right, rgba(58,107,124,0.15), transparent 60%)',
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
            For Guides
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
            Your Skills. Their Water.<br />More Clients.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(240,234,214,.6)',
              maxWidth: 560,
              margin: '0 auto 40px',
            }}
          >
            AnglerPass connects professional guides with private water across the country.
            Get approved, set your rates, and let anglers book you directly when they
            reserve their trip. No cold calls, no middlemen.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/signup"
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
                background: 'var(--color-bronze)',
                color: '#fff',
                transition: 'all .4s',
              }}
            >
              Apply as a Guide &rarr;
            </Link>
            <Link
              href="/#waitlist"
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
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '120px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-charcoal)',
              }}
            >
              Guide Tools
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                fontWeight: 500,
                color: 'var(--color-forest)',
                margin: '0 0 16px',
                letterSpacing: '-.3px',
                textWrap: 'balance',
              }}
            >
              Everything you need to run your guiding business
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--color-text-secondary)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              Your dashboard, your schedule, your clients. AnglerPass handles the
              logistics so you can focus on putting people on fish.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}
            className="marketing-features-grid"
          >
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`reveal d${(i % 3) + 1}`}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-parchment)',
                  borderRadius: 14,
                  padding: '36px 28px',
                  transition: 'all .5s cubic-bezier(.22,1,.36,1)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(51,51,51,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    color: 'var(--color-charcoal)',
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--color-forest)',
                    marginBottom: 10,
                    letterSpacing: '-.2px',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-charcoal)',
              }}
            >
              How It Works
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
              From sign-up to first trip
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 0 }}>
            {howItWorks.map((item, i) => (
              <div
                key={item.step}
                className={`reveal d${(i % 3) + 1}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr',
                  gap: 24,
                  padding: '32px 0',
                  borderBottom: i < howItWorks.length - 1 ? '1px solid var(--color-parchment)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--color-charcoal)',
                    fontWeight: 600,
                    paddingTop: 4,
                  }}
                >
                  {item.step}
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 22,
                      fontWeight: 600,
                      color: 'var(--color-forest)',
                      marginBottom: 8,
                      letterSpacing: '-.2px',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section style={{ padding: '100px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-charcoal)',
              }}
            >
              Requirements
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
              What we look for
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--color-text-secondary)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              We vet every guide on the platform. Landowners and clubs need to trust
              that anyone guiding on their water meets professional standards.
            </p>
          </div>

          <div
            className="reveal"
            style={{
              background: '#fff',
              border: '1px solid var(--color-parchment)',
              borderRadius: 14,
              padding: '40px 36px',
              maxWidth: 500,
              margin: '0 auto',
            }}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {requirements.map((req) => (
                <li
                  key={req}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    fontSize: 15,
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-parchment)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-charcoal)',
              }}
            >
              Pricing
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
              No subscription. No sign-up fees.
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--color-text-secondary)',
                maxWidth: 560,
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              You set your rates. We add a 10% service fee on top, paid by the angler.
              You keep 100% of your stated rate on every trip.
            </p>
          </div>

          <div
            className="reveal"
            style={{
              background: '#fff',
              border: '2px solid var(--color-charcoal)',
              borderRadius: 14,
              padding: '48px 40px',
              maxWidth: 560,
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--color-forest)',
                marginBottom: 8,
              }}
            >
              Free to join
            </h3>
            <p
              style={{
                fontSize: 15,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.65,
                marginBottom: 32,
              }}
            >
              No monthly fee, no listing fee, no hidden costs.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                marginBottom: 32,
                textAlign: 'left',
              }}
              className="marketing-features-grid"
            >
              <div
                style={{
                  background: 'var(--color-offwhite)',
                  borderRadius: 10,
                  padding: '24px 20px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-text-light)', marginBottom: 8 }}>
                  Example
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Your rate</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>$500</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Service fee (angler pays)</span>
                    <span style={{ color: 'var(--color-text-light)' }}>+$50</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', borderTop: '1px solid var(--color-parchment)', marginTop: 8 }}>
                    <span style={{ fontWeight: 600 }}>You receive</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>$500</span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'var(--color-offwhite)',
                  borderRadius: 10,
                  padding: '24px 20px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-text-light)', marginBottom: 8 }}>
                  What&apos;s included
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {['Profile & portfolio', 'Booking management', 'Calendar tools', 'Messaging', 'Review system', 'Stripe payouts'].map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              href="/signup"
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
                background: 'var(--color-charcoal)',
                color: '#fff',
                transition: 'all .4s',
              }}
            >
              Apply as a Guide &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '100px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-charcoal)',
              }}
            >
              FAQ
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
              Common questions
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 0 }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`reveal d${(i % 3) + 1}`}
                style={{
                  padding: '24px 0',
                  borderBottom: i < faqs.length - 1 ? '1px solid var(--color-parchment)' : 'none',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--color-forest)',
                    marginBottom: 8,
                    letterSpacing: '-.2px',
                  }}
                >
                  {faq.q}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '100px 0',
          background: 'var(--color-charcoal)',
          textAlign: 'center',
        }}
      >
        <div className="reveal" style={{ maxWidth: 600, margin: '0 auto', padding: '0 32px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 500,
              color: 'var(--color-parchment)',
              margin: '0 0 16px',
              letterSpacing: '-.3px',
            }}
          >
            Ready to expand your range?
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: 'rgba(240,234,214,.55)',
              maxWidth: 480,
              margin: '0 auto 40px',
            }}
          >
            Join a growing network of professional guides accessing private water
            across the country. Your next client is already looking.
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '18px 40px',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '.3px',
              textDecoration: 'none',
              background: 'var(--color-bronze)',
              color: '#fff',
              transition: 'all .4s',
            }}
          >
            Apply as a Guide &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
