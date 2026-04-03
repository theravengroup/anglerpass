'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FooterModal from '@/components/homepage/FooterModal';

export default function MarketingFooter() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <>
      <footer className="pt-15 pb-11 bg-forest-deep text-white/50">
        <div className="mx-auto max-w-[1200px] px-8">
          <div
            className="marketing-footer-grid grid grid-cols-[2fr_1fr_1fr_1fr] gap-10"
          >
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
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bronze-light mb-4">
                Platform
              </h4>
              <ul className="list-none m-0 p-0">
                {[
                  { href: '/landowners', label: 'For Landowners' },
                  { href: '/clubs', label: 'For Clubs' },
                  { href: '/anglers', label: 'For Anglers' },
                  { href: '/guides', label: 'For Guides' },
                  { href: '/clubs#corporate', label: 'Corporate Memberships' },
                  { href: '/pricing', label: 'Pricing' },
                ].map((link) => (
                  <li key={link.href} className="mb-2.5">
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bronze-light mb-4">
                Company
              </h4>
              <ul className="list-none m-0 p-0">
                <li className="mb-2.5">
                  <Link
                    href="/#faq"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    FAQ
                  </Link>
                </li>
                <li className="mb-2.5">
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300 cursor-pointer"
                  >
                    Contact
                  </a>
                </li>
                <li className="mb-2.5">
                  <Link
                    href="/#investors"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    Investors
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bronze-light mb-4">
                Legal
              </h4>
              <ul className="list-none m-0 p-0">
                <li className="mb-2.5">
                  <Link
                    href="/privacy"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li className="mb-2.5">
                  <Link
                    href="/terms"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li className="mb-2.5">
                  <Link
                    href="/policies"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    Policies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="marketing-footer-bottom mt-11 pt-7 border-t border-white/[.06] flex justify-between items-center text-xs text-white/25"
          >
            <span>&copy; {new Date().getFullYear()} AnglerPass. All rights reserved.</span>
            <a
              href={pathname === '/' ? '#hero' : '/'}
              onClick={pathname === '/' ? (e: React.MouseEvent) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } : undefined}
              className="text-white/35 no-underline transition-colors duration-300"
            >
              Back to home
            </a>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <FooterModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        title="Contact AnglerPass"
      >
        <p className="modal-text">
          Have a question, partnership opportunity, or feedback? We&rsquo;d love to hear from you.
        </p>

        <div className="modal-contact-info">
          <div className="modal-contact-row">
            <h3 className="modal-heading">General Inquiries</h3>
            <p className="modal-text">
              <a href="mailto:hello@anglerpass.com">hello@anglerpass.com</a>
            </p>
          </div>

          <div className="modal-contact-row">
            <h3 className="modal-heading">Investor Relations</h3>
            <p className="modal-text">
              <a href="mailto:investors@anglerpass.com">investors@anglerpass.com</a>
            </p>
          </div>

          <div className="modal-contact-row">
            <h3 className="modal-heading">Landowners &amp; Clubs</h3>
            <p className="modal-text">
              Interested in listing your property or club on AnglerPass?{' '}
              <a href="mailto:partners@anglerpass.com">partners@anglerpass.com</a>
            </p>
          </div>

          <div className="modal-contact-row">
            <h3 className="modal-heading">Press &amp; Media</h3>
            <p className="modal-text">
              <a href="mailto:press@anglerpass.com">press@anglerpass.com</a>
            </p>
          </div>
        </div>

        <p className="modal-text mt-6 text-[13px] opacity-60">
          We typically respond within 24&ndash;48 hours.
        </p>
      </FooterModal>
    </>
  );
}
