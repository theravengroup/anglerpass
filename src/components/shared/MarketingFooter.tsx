/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

const footerLinks = {
  Platform: [
    { href: '/landowners', label: 'For Landowners' },
    { href: '/clubs', label: 'For Clubs' },
    { href: '/anglers', label: 'For Anglers' },
  ],
  Company: [
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
    { href: 'mailto:investors@anglerpass.com', label: 'Investors' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

export default function MarketingFooter() {
  return (
    <footer
      style={{
        padding: '60px 0 44px',
        background: 'var(--color-forest-deep)',
        color: 'rgba(255,255,255,.5)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 40,
          }}
          className="marketing-footer-grid"
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                marginBottom: 14,
              }}
            >
              <img
                src="/images/anglerpass-noword-logo.svg"
                alt=""
                style={{ height: 32, width: 'auto', opacity: 0.7 }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#fff',
                  letterSpacing: '-.3px',
                }}
              >
                AnglerPass
              </span>
            </Link>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,.38)',
                maxWidth: 280,
                lineHeight: 1.6,
              }}
            >
              The operating platform for private fly fishing access. Connecting
              landowners, clubs, and anglers.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-bronze-light)',
                  marginBottom: 16,
                }}
              >
                {heading}
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {links.map((link) => (
                  <li key={link.href} style={{ marginBottom: 10 }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,.4)',
                        textDecoration: 'none',
                        transition: 'color .3s',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 44,
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,.25)',
          }}
          className="marketing-footer-bottom"
        >
          <span>&copy; {new Date().getFullYear()} AnglerPass. All rights reserved.</span>
          <Link
            href="/"
            style={{
              color: 'rgba(255,255,255,.35)',
              textDecoration: 'none',
              transition: 'color .3s',
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </footer>
  );
}
