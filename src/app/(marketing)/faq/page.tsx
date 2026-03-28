import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';
import FaqAccordion from './FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about AnglerPass, the operating platform for private fly fishing access.',
};

export default function FaqPage() {
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
            Questions
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
            Frequently Asked
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
            Everything you need to know about AnglerPass, from what it is to how
            you can get involved.
          </p>
        </div>
      </section>

      {/* FAQ content */}
      <section style={{ padding: '80px 0 100px', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 32px' }}>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 0', background: 'var(--color-parchment-light)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 32px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 500,
              color: 'var(--color-forest)',
              margin: '0 0 12px',
              letterSpacing: '-.3px',
            }}
          >
            Still have questions?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'var(--color-text-secondary)',
              maxWidth: 440,
              margin: '0 auto 36px',
              lineHeight: 1.65,
            }}
          >
            We&apos;d love to hear from you. Reach out and we&apos;ll get back to
            you as soon as we can.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                background: 'var(--color-forest)',
                color: 'var(--color-offwhite)',
                transition: 'all .4s',
              }}
            >
              Contact Us
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
                color: 'var(--color-forest)',
                border: '1px solid rgba(45,61,48,.2)',
                transition: 'all .4s',
              }}
            >
              Join the Waitlist
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
