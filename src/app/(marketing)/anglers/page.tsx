import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Anglers — AnglerPass',
  description:
    'Discover private waters, book experiences, and access trusted properties. AnglerPass connects serious anglers with exceptional water.',
  openGraph: {
    title: 'For Anglers — AnglerPass',
    description:
      'Discover private waters, book experiences, and access trusted properties across the country.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Anglers — AnglerPass',
    description:
      'Discover private waters, book experiences, and access trusted properties across the country.',
  },
};

const features = [
  {
    title: 'Discover Private Waters',
    description:
      'Browse private fly fishing properties available through your club. Filter by location, species, season, and access type to find water worth traveling for.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: 'Book Through Your Club',
    description:
      'Request access and book fishing days through your club membership. Clear pricing, availability, and terms before you commit.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    title: 'Vetted Access',
    description:
      'Every angler on AnglerPass is vouched for by their club. Landowners trust the platform because clubs vet their members — creating access opportunities that wouldn\u2019t exist otherwise.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Availability',
    description:
      'See what is open, when, and for how many rods. No guessing, no unanswered emails, no waiting weeks for a callback.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Angler Profile',
    description:
      'Build your fishing resume. Track properties visited, species caught, and build a reputation that opens doors to premium waters.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: 'Trip Planning',
    description:
      'Save properties, compare options, and plan multi-day trips across different waters. Everything organized in one place.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
];

export default function AnglersPage() {
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
            className="audience-hero-badge"
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
            For Anglers
          </span>
          <h1
            className="audience-hero-heading"
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
            Find the Water<br />Worth Finding.
          </h1>
          <p
            className="audience-hero-sub"
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(240,234,214,.6)',
              maxWidth: 560,
              margin: '0 auto 40px',
            }}
          >
            Access private waters through trusted fly fishing clubs. AnglerPass
            connects serious anglers with exceptional properties through a
            club-based platform built on vetting, trust, and respect for the resource.
          </p>
          <div className="audience-hero-ctas" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                background: 'var(--color-bronze)',
                color: '#fff',
                transition: 'all .4s',
              }}
            >
              Join the Waitlist &rarr;
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
              Get in Touch
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
                color: 'var(--color-bronze)',
              }}
            >
              The Angler Experience
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
              Access water worth the trip
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
              Join a club, get vetted, and unlock access to private waters that
              were previously available only through personal connections.
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
                    background: 'rgba(154,115,64,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    color: 'var(--color-bronze)',
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

      {/* Club membership trust section */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)' }}>
        <div className="reveal" style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
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
            How It Works
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 500,
              color: 'var(--color-forest)',
              margin: '0 0 20px',
              letterSpacing: '-.3px',
              textWrap: 'balance',
            }}
          >
            Access starts with your club
          </h2>
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
              maxWidth: 620,
              margin: '0 auto 48px',
            }}
          >
            AnglerPass is not a free-for-all booking site. Every angler accesses private
            water through a fly fishing club that vouches for its members. Clubs are the
            trust layer that makes landowners comfortable opening their gates.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              textAlign: 'left',
            }}
            className="marketing-features-grid"
          >
            {[
              { step: '01', title: 'Join a Club', text: 'Find a fly fishing club on AnglerPass and apply for membership. Clubs set their own standards and vet every applicant.' },
              { step: '02', title: 'Get Vetted', text: 'Your club reviews your application and vouches for you as a responsible angler. This vetting is what earns landowner trust.' },
              { step: '03', title: 'Book Water', text: 'Once you\u2019re a club member, browse properties your club has access to and book fishing days through the platform.' },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`reveal d${i + 1}`}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-parchment)',
                  borderRadius: 14,
                  padding: '32px 24px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-bronze)',
                    letterSpacing: '0.15em',
                    marginBottom: 12,
                  }}
                >
                  STEP {item.step}
                </span>
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
                  {item.title}
                </h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking fees section */}
      <section style={{ padding: '80px 0', background: 'var(--color-offwhite)' }}>
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
            Transparent Pricing
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 500,
              color: 'var(--color-forest)',
              margin: '0 0 20px',
              letterSpacing: '-.3px',
              textWrap: 'balance',
            }}
          >
            Simple, fair booking fees
          </h2>
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
              maxWidth: 560,
              margin: '0 auto 32px',
            }}
          >
            When you book a fishing day through AnglerPass, a small platform fee of
            5% is added to the property&rsquo;s base rate. Rod fees are set by each
            landowner and vary by property. Here&rsquo;s how a typical booking breaks down:
          </p>
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--color-parchment)',
              borderRadius: 14,
              padding: '28px 32px',
              maxWidth: 480,
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-text-light)', marginBottom: 16 }}>
              Example booking
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--color-parchment)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Rod fee (set by landowner)</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-forest)' }}>$125</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--color-parchment)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Platform fee (5%)</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-bronze)' }}>$6.25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-forest)' }}>You pay</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-forest)' }}>$131.25</span>
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-text-light)',
              marginTop: 16,
              fontStyle: 'italic',
            }}
          >
            No hidden fees. No subscription required for anglers. You only pay when you book.
          </p>
        </div>
      </section>

      {/* Cross-club access section */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)' }}>
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
            The Network Effect
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 500,
              color: 'var(--color-forest)',
              margin: '0 0 20px',
              letterSpacing: '-.3px',
              textWrap: 'balance',
            }}
          >
            One membership, expanding access
          </h2>
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            Clubs on AnglerPass can opt in to cross-club access agreements, meaning
            your membership in one club can unlock fishing days on water managed by
            other clubs in the network. The more clubs that join, the more water
            becomes available to you &mdash; without needing multiple memberships.
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
            Your next best day on the water starts here
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
            Join the waitlist and be among the first anglers to access
            exceptional private waters through club-vetted booking on AnglerPass.
          </p>
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
        </div>
      </section>
    </>
  );
}
