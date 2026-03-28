import Link from 'next/link';
import AnglerPassLogo from '@/components/icons/AnglerPassLogo';

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
    <footer className="border-t border-parchment bg-forest-deep text-parchment-light">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
              <AnglerPassLogo className="h-7 w-7 text-parchment/60" />
              <span className="font-heading text-xl font-semibold text-parchment">
                AnglerPass
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-parchment/60">
              The operating platform for private fly fishing access. Connecting
              landowners, clubs, and anglers.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-bronze-light">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-parchment/50 transition-colors hover:text-parchment"
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
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-parchment/10 pt-8 sm:flex-row">
          <span className="text-xs text-parchment/40">
            &copy; {new Date().getFullYear()} AnglerPass. All rights reserved.
          </span>
          <Link
            href="/"
            className="text-xs text-parchment/40 transition-colors hover:text-parchment/70"
          >
            Back to home
          </Link>
        </div>
      </div>
    </footer>
  );
}
