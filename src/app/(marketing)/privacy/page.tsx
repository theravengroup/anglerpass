import type { Metadata } from 'next';
import MarketingLayout from '@/components/shared/MarketingLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AnglerPass privacy policy.',
};

export default function PrivacyPage() {
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
            Privacy Policy
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
              AnglerPass is operated by The Raven Group LLC. We take your privacy seriously. This policy explains what data we collect and how we use it.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              What we collect
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              AnglerPass does not require an account to browse listings or learn about the platform. When you join the waitlist, request early access, or submit an investor inquiry, we collect your name, email address, and any information you provide in the form. If you create an account in the future, we&rsquo;ll collect standard account information needed to operate the platform.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              How we use your data
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              We use your information solely to communicate with you about AnglerPass &mdash; including waitlist updates, early access invitations, and investor communications. We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Analytics
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              We use privacy-respecting analytics to understand how visitors use AnglerPass &mdash; such as which sections are viewed and general usage patterns. We do not build advertising profiles or sell data to third parties.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Cookies
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              AnglerPass uses minimal cookies required for site functionality and authentication. We do not use advertising cookies, tracking pixels, or third-party marketing tools.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Third-party services
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              Our site is hosted on Vercel. Authentication and data storage are managed through Supabase. Future payment processing will be handled by Stripe. Each service has its own privacy policy.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Your data rights
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              You may request deletion of any personal information we hold by contacting us. We will remove your data promptly upon request.
            </p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
              Changes to this policy
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>
              If we make changes to this policy, we&rsquo;ll update the date at the top. We will never introduce advertising or sell user data &mdash; that is a core commitment of the AnglerPass platform.
            </p>

            <div style={{ borderTop: '1px solid var(--color-parchment)', paddingTop: 28, marginTop: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: 'var(--color-forest)', margin: '0 0 12px', letterSpacing: '-.2px' }}>
                Questions?
              </h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: 0 }}>
                If you have any questions about our approach to privacy, please contact us at{' '}
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
