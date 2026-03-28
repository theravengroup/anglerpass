import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the AnglerPass team. Whether you are a landowner, club, or angler, we would love to hear from you.',
};

const contactCards = [
  {
    label: 'General Inquiries',
    email: 'hello@anglerpass.com',
    description: null,
  },
  {
    label: 'Investor Relations',
    email: 'investors@anglerpass.com',
    description: null,
  },
  {
    label: 'Landowners & Clubs',
    email: 'partners@anglerpass.com',
    description: 'Interested in listing your property or club on AnglerPass?',
  },
  {
    label: 'Press & Media',
    email: 'press@anglerpass.com',
    description: null,
  },
];

export default function ContactPage() {
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
            Contact
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
            Let&apos;s Start a Conversation
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
            Have a question, partnership opportunity, or feedback? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section style={{ padding: '100px 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 32px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 20,
            }}
            className="marketing-contact-grid"
          >
            {contactCards.map((card) => (
              <div
                key={card.email}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-parchment)',
                  borderRadius: 14,
                  padding: '32px 28px',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: 'var(--color-bronze)',
                    marginBottom: 12,
                  }}
                >
                  {card.label}
                </span>
                {card.description && (
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.65,
                      color: 'var(--color-text-secondary)',
                      margin: '0 0 12px',
                    }}
                  >
                    {card.description}
                  </p>
                )}
                <a
                  href={`mailto:${card.email}`}
                  style={{
                    fontSize: 15.5,
                    color: 'var(--color-forest)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'color .3s',
                  }}
                >
                  {card.email}
                </a>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              opacity: 0.7,
              marginTop: 40,
            }}
          >
            We typically respond within 24&ndash;48 hours.
          </p>
        </div>
      </section>

      {/* Location + CTA */}
      <section
        style={{
          padding: '100px 0',
          background: 'var(--color-forest-deep)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 32px' }}>
          <span
            style={{
              display: 'inline-block',
              marginBottom: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'var(--color-bronze-light)',
            }}
          >
            Based in
          </span>
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
            The American West
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
            Building tools for the waters we know and love. Join the waitlist and be among the first to experience AnglerPass.
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
