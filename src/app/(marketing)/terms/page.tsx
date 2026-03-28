import type { Metadata } from 'next';
import MarketingLayout from '@/components/shared/MarketingLayout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AnglerPass terms of service.',
};

export default function TermsPage() {
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
            Legal
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
            Terms of Service
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
            Last updated: March 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '80px 0 100px', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 32px' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--color-parchment)',
              borderRadius: 14,
              padding: '48px 40px',
            }}
          >
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              By using AnglerPass, you agree to the following terms. Please read them carefully.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Overview
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              AnglerPass is a platform connecting private water landowners, fishing clubs, and anglers. We provide tools for managing access, memberships, and bookings on private fly fishing properties. The platform is currently in early development, and features may change as we build.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Accounts
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              When accounts become available, you are responsible for maintaining the security of your login credentials and for all activity under your account. You must provide accurate information when creating an account.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Acceptable use
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              You agree to use AnglerPass only for its intended purpose. You may not use the platform to misrepresent property access, create fraudulent listings, harass other users, or violate any applicable laws or regulations.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Content &amp; listings
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              Property owners and clubs are responsible for the accuracy of their listings, availability, and pricing. AnglerPass acts as a platform and does not guarantee the quality, safety, or legality of any listed property or fishing experience.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Payments &amp; fees
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              Payment processing will be handled through Stripe. Platform fees, cancellation policies, and refund terms will be published before any paid transactions are enabled. During the current pre-launch phase, no payments are processed.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Limitation of liability
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              AnglerPass is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the platform, interactions with other users, or experiences on listed properties. Fishing and outdoor activities carry inherent risks.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Intellectual property
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              All AnglerPass branding, design, and platform code are the property of The Raven Group LLC. User-submitted content (property descriptions, photos) remains the property of the submitter, with a license granted to AnglerPass for display on the platform.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Termination
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting us.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Changes to these terms
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              We may update these terms as the platform evolves. Significant changes will be communicated to registered users. Continued use of the platform constitutes acceptance of updated terms.
            </p>

            <div style={{ borderTop: '1px solid var(--color-parchment)', paddingTop: 28, marginTop: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
                Questions?
              </h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: 0 }}>
                If you have questions about our terms of service, please contact us at{' '}
                <a
                  href="mailto:hello@anglerpass.com"
                  style={{ color: 'var(--color-river)', textDecoration: 'none', fontWeight: 500 }}
                >
                  hello@anglerpass.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
