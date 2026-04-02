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
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300 cursor-pointer"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li className="mb-2.5">
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300 cursor-pointer"
                  >
                    Terms of Service
                  </a>
                </li>
                <li className="mb-2.5">
                  <Link
                    href="/policies"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    Policies
                  </Link>
                </li>
                <li className="mb-2.5">
                  <Link
                    href="/legal/review-policy"
                    className="text-[13px] text-white/40 no-underline transition-colors duration-300"
                  >
                    Review Policy
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

      {/* Privacy Policy Modal */}
      <FooterModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
      >
        <p className="modal-meta">Last updated: March 2026</p>

        <p className="modal-text">
          AnglerPass is operated by The Raven Group LLC. We take your privacy seriously. This policy explains what data we collect and how we use it.
        </p>

        <h3 className="modal-heading">What we collect</h3>
        <p className="modal-text">
          AnglerPass does not require an account to browse listings or learn about the platform. When you join the waitlist, request early access, or submit an investor inquiry, we collect your name, email address, and any information you provide in the form. If you create an account in the future, we&rsquo;ll collect standard account information needed to operate the platform.
        </p>

        <h3 className="modal-heading">How we use your data</h3>
        <p className="modal-text">
          We use your information solely to communicate with you about AnglerPass &mdash; including waitlist updates, early access invitations, and investor communications. We do not sell, rent, or share your personal information with third parties for marketing purposes.
        </p>

        <h3 className="modal-heading">Analytics</h3>
        <p className="modal-text">
          We use privacy-respecting analytics to understand how visitors use AnglerPass &mdash; such as which sections are viewed and general usage patterns. We do not build advertising profiles or sell data to third parties.
        </p>

        <h3 className="modal-heading">Cookies</h3>
        <p className="modal-text">
          AnglerPass uses minimal cookies required for site functionality and authentication. We do not use advertising cookies, tracking pixels, or third-party marketing tools.
        </p>

        <h3 className="modal-heading">Third-party services</h3>
        <p className="modal-text">
          Our site is hosted on Vercel. Authentication and data storage are managed through Supabase. Future payment processing will be handled by Stripe. Each service has its own privacy policy.
        </p>

        <h3 className="modal-heading">Your data rights</h3>
        <p className="modal-text">
          You may request deletion of any personal information we hold by contacting us. We will remove your data promptly upon request.
        </p>

        <h3 className="modal-heading">Changes to this policy</h3>
        <p className="modal-text">
          If we make changes to this policy, we&rsquo;ll update the date at the top. We will never introduce advertising or sell user data &mdash; that is a core commitment of the AnglerPass platform.
        </p>
      </FooterModal>

      {/* Terms of Service Modal */}
      <FooterModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
      >
        <p className="modal-meta">Last updated: March 2026</p>

        <p className="modal-text">
          By using AnglerPass, you agree to the following terms. Please read them carefully.
        </p>

        <h3 className="modal-heading">Overview</h3>
        <p className="modal-text">
          AnglerPass is a platform connecting private water landowners, fishing clubs, and anglers. We provide tools for managing access, memberships, and bookings on private fly fishing properties. The platform is currently in early development, and features may change as we build.
        </p>

        <h3 className="modal-heading">Accounts</h3>
        <p className="modal-text">
          When accounts become available, you are responsible for maintaining the security of your login credentials and for all activity under your account. You must provide accurate information when creating an account.
        </p>

        <h3 className="modal-heading">Acceptable use</h3>
        <p className="modal-text">
          You agree to use AnglerPass only for its intended purpose. You may not use the platform to misrepresent property access, create fraudulent listings, harass other users, or violate any applicable laws or regulations.
        </p>

        <h3 className="modal-heading">Content &amp; listings</h3>
        <p className="modal-text">
          Property owners and clubs are responsible for the accuracy of their listings, availability, and pricing. AnglerPass acts as a platform and does not guarantee the quality, safety, or legality of any listed property or fishing experience.
        </p>

        <h3 className="modal-heading">Payments &amp; fees</h3>
        <p className="modal-text">
          Payment processing will be handled through Stripe. Platform fees, cancellation policies, and refund terms will be published before any paid transactions are enabled. During the current pre-launch phase, no payments are processed.
        </p>

        <h3 className="modal-heading">Limitation of liability</h3>
        <p className="modal-text">
          AnglerPass is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the platform, interactions with other users, or experiences on listed properties. Fishing and outdoor activities carry inherent risks.
        </p>

        <h3 className="modal-heading">Intellectual property</h3>
        <p className="modal-text">
          All AnglerPass branding, design, and platform code are the property of The Raven Group LLC. User-submitted content (property descriptions, photos) remains the property of the submitter, with a license granted to AnglerPass for display on the platform.
        </p>

        <h3 className="modal-heading">Termination</h3>
        <p className="modal-text">
          We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting us.
        </p>

        <h3 className="modal-heading">Changes to these terms</h3>
        <p className="modal-text">
          We may update these terms as the platform evolves. Significant changes will be communicated to registered users. Continued use of the platform constitutes acceptance of updated terms.
        </p>
      </FooterModal>

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
