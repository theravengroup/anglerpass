'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ContactModal from '@/components/shared/ContactModal';
import ContactForm from '@/components/shared/ContactForm';

/* ──────────────── Footer Link Data ──────────────── */

const PLATFORM_LINKS = [
  { href: '/landowners', label: 'For Landowners' },
  { href: '/clubs', label: 'For Clubs' },
  { href: '/anglers', label: 'For Anglers' },
  { href: '/guides', label: 'For Independent Guides' },
  { href: '/corporates', label: 'Corporate Memberships' },
  { href: '/explore', label: 'Explore Waters' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/learn', label: 'Learn' },
] as const;

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/policies', label: 'Policies' },
  { href: '/conservation', label: 'Conservation' },
] as const;

/* ──────────────── Link Column ──────────────── */

function FooterLinkColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bronze-light mb-4">
        {heading}
      </h4>
      <ul className="list-none m-0 p-0">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li className="mb-1.5">
      <Link
        href={href}
        className="text-[13px] text-white/40 no-underline transition-colors duration-300"
      >
        {label}
      </Link>
    </li>
  );
}

function FooterButtonLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <li className="mb-1.5">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className="text-[13px] text-white/40 no-underline transition-colors duration-300 cursor-pointer"
      >
        {label}
      </a>
    </li>
  );
}

/* ──────────────── Footer ──────────────── */

export default function MarketingFooter() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  // Check auth state for account link
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  // Listen for custom event from FinalCtaSection (or anywhere else)
  useEffect(() => {
    function handleOpenContact() {
      setActiveModal('contact');
    }
    window.addEventListener('open-contact-modal', handleOpenContact);
    return () => window.removeEventListener('open-contact-modal', handleOpenContact);
  }, []);

  return (
    <>
      <footer className="pt-15 pb-11 bg-forest-deep text-white/50">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="marketing-footer-grid grid grid-cols-[2fr_1fr_1fr_1fr] gap-10">
            {/* Brand */}
            <div>
              <Link
                href="/"
                className="flex items-center gap-2.5 no-underline mb-3.5"
              >
                <img
                  src="/images/anglerpass-noword-logo.svg"
                  alt=""
                  className="h-8 w-auto opacity-70"
                />
                <span className="font-heading text-xl font-semibold text-white tracking-[-0.3px]">
                  AnglerPass
                </span>
              </Link>
              <p className="text-[13px] text-white/[.38] max-w-[280px] leading-[1.6]">
                The operating platform for private fly fishing access. Connecting
                landowners, clubs, and anglers.
              </p>
            </div>

            {/* Platform */}
            <FooterLinkColumn heading="Platform">
              {PLATFORM_LINKS.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </FooterLinkColumn>

            {/* Company */}
            <FooterLinkColumn heading="Company">
              <FooterLink href="/about" label="About" />
              <FooterLink href="/team" label="Team" />
              <FooterLink href="/#faq" label="FAQ" />
              <FooterButtonLink
                label="Contact"
                onClick={() => setActiveModal('contact')}
              />
              <FooterLink href="/#investors" label="Investors" />
              <FooterLink href="/press" label="Press" />
            </FooterLinkColumn>

            {/* Legal & Account */}
            <FooterLinkColumn heading="Legal">
              {LEGAL_LINKS.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
              <li className="mt-4 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bronze-light">
                  Account
                </span>
              </li>
              {isLoggedIn ? (
                <>
                  <FooterLink href="/dashboard" label="Dashboard" />
                  <FooterLink href="/dashboard/settings" label="Settings" />
                </>
              ) : (
                <FooterLink href="/login" label="Log In" />
              )}
            </FooterLinkColumn>
          </div>

          {/* Affiliate disclosure */}
          <div className="mt-11 pt-5 border-t border-white/[.06] text-[11px] leading-relaxed text-white/20 max-w-[640px]">
            Some product recommendations on AnglerPass contain affiliate links. We may earn a small commission on purchases at no&nbsp;extra&nbsp;cost&nbsp;to&nbsp;you.
          </div>

          {/* Bottom bar */}
          <div className="marketing-footer-bottom mt-5 pt-5 border-t border-white/[.06] flex justify-between items-center text-xs text-white/25">
            <span>&copy; {new Date().getFullYear()} AnglerPass. All rights reserved.</span>
            <a
              href={pathname === '/' ? '#hero' : '/'}
              onClick={
                pathname === '/'
                  ? (e: React.MouseEvent) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  : undefined
              }
              className="text-white/35 no-underline transition-colors duration-300"
            >
              Back to home
            </a>
          </div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      <ContactModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        title="Contact AnglerPass"
      >
        <ContactForm onSuccess={() => setActiveModal(null)} />
      </ContactModal>
    </>
  );
}
