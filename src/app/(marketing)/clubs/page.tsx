import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';

export const metadata: Metadata = {
  title: 'For Clubs — AnglerPass',
  description:
    'Run your fishing club with modern tools. Membership management, scheduling, roster tools, and reservation coordination with AnglerPass.',
};

const features = [
  {
    title: 'Membership Management',
    description:
      'Track active members, dues status, membership tiers, and renewal dates. A single source of truth for your entire roster.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Access Scheduling',
    description:
      'Coordinate who fishes where and when. Assign beats, manage rotation schedules, and prevent double-booking across your waters.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Digital Rosters',
    description:
      'Maintain member directories with contact details, access history, and preferences. Searchable, sortable, and always current.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    title: 'Reservation Coordination',
    description:
      'Let members request and reserve fishing days through a structured system. Automated confirmations, waitlists, and cancellation handling.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
      </svg>
    ),
  },
  {
    title: 'Member Communication',
    description:
      'Send announcements, event notices, and updates to your membership. Targeted messaging by tier, activity, or custom groups.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: 'Guest & Event Management',
    description:
      'Handle guest passes, tournament days, and special events within the same platform. Track guest history and set club policies.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
];

export default function ClubsPage() {
  return (
    <MarketingLayout>
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
            For Clubs
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
            Run Your Club<br />Like It Deserves.
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
            Membership rosters, scheduling, reservations, and communication
            tools designed for fly fishing clubs that take their operations
            seriously.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
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
              href="/contact"
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
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '120px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
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
              Club Operations
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
              Modern tools for serious clubs
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
              Replace binders, email chains, and bulletin boards with a platform
              built specifically for fly fishing club management.
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
            {features.map((feature) => (
              <div
                key={feature.title}
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
                    background: 'rgba(58,107,124,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    color: 'var(--color-river)',
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

      {/* Value prop */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
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
            Built for Clubs
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
            Your members deserve a better experience
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
            The best clubs run on clear communication, fair scheduling, and
            organized operations. AnglerPass gives your board and members the
            tools to make that effortless.
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
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 32px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 500,
              color: 'var(--color-parchment)',
              margin: '0 0 16px',
              letterSpacing: '-.3px',
            }}
          >
            Bring your club into the modern era
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
            Join the waitlist and be among the first clubs to use AnglerPass when
            we launch.
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
    </MarketingLayout>
  );
}
