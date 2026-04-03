'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FooterModal from '@/components/homepage/FooterModal';
import {
  contactSchema,
  CONTACT_DEPARTMENTS,
  type ContactFormData,
} from '@/lib/validations/contact';

export default function MarketingFooter() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const pathname = usePathname();

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

      {/* Contact Form Modal */}
      <FooterModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        title="Contact AnglerPass"
      >
        <ContactForm onSuccess={() => setActiveModal(null)} />
      </FooterModal>
    </>
  );
}

function ContactForm({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setStatus('success');
      reset();
      setTimeout(() => onSuccess(), 2500);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="contact-form-success">
        <div className="contact-form-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="modal-text" style={{ textAlign: 'center', marginTop: '12px' }}>
          Message sent! We&rsquo;ll get back to you within 24&ndash;48 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="modal-text">
        Send us a message and we&rsquo;ll route it to the right team. We typically respond within 24&ndash;48 hours.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="contact-name">Name</label>
          <input
            type="text"
            id="contact-name"
            placeholder="Your full name"
            {...register('name')}
          />
          {errors.name && (
            <span className="contact-form-error" role="alert" aria-live="polite">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contact-email">Email</label>
          <input
            type="email"
            id="contact-email"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && (
            <span className="contact-form-error" role="alert" aria-live="polite">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contact-department">Department</label>
          <select
            id="contact-department"
            defaultValue=""
            {...register('department')}
          >
            <option value="" disabled>Select a department</option>
            {CONTACT_DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
          {errors.department && (
            <span className="contact-form-error" role="alert" aria-live="polite">
              {errors.department.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            placeholder="How can we help?"
            rows={4}
            {...register('message')}
          />
          {errors.message && (
            <span className="contact-form-error" role="alert" aria-live="polite">
              {errors.message.message}
            </span>
          )}
        </div>

        {status === 'error' && (
          <p className="contact-form-error" role="alert" aria-live="polite" style={{ marginBottom: '12px' }}>
            Something went wrong. Please try again or email us directly.
          </p>
        )}

        <div className="contact-form-submit">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin .6s linear infinite' }}>
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8" />
                </svg>{' '}
                Sending...
              </>
            ) : (
              <>
                Send Message{' '}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
