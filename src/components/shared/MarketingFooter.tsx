'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  contactSchema,
  CONTACT_DEPARTMENTS,
  type ContactFormData,
} from '@/lib/validations/contact';

/* ──────────────── Tailwind-based Modal Shell ──────────────── */

function ContactModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-forest-deep/90 backdrop-blur-sm p-4 animate-[fadeIn_0.25s_ease_both]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-[540px] max-h-[80vh] bg-parchment border border-parchment rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 size-10 rounded-full bg-black/[0.04] border border-parchment cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-black/[0.08] hover:scale-[1.08] z-10 text-text-secondary"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="font-heading text-2xl font-semibold text-forest-deep px-8 pt-8 tracking-[-0.3px]">
          {title}
        </h2>
        <div className="px-8 pt-5 pb-8 overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Contact Form ──────────────── */

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
      <div className="py-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-forest/10 text-forest">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="mt-3 text-[14.5px] leading-[1.7] text-text-secondary">
          Message sent! We&rsquo;ll get back to you within 24&ndash;48 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[14.5px] leading-[1.7] text-text-secondary mb-5">
        Send us a message and we&rsquo;ll route it to the right team. We typically respond within 24&ndash;48 hours.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-[18px]">
          <label htmlFor="contact-name" className="block text-xs font-medium text-text-primary mb-1.5 tracking-[0.3px]">
            Name
          </label>
          <input
            type="text"
            id="contact-name"
            placeholder="Your full name"
            className="w-full px-4 py-[13px] border border-black/12 rounded-md font-body text-sm text-text-primary bg-white transition-all duration-300 outline-none focus:border-river focus:ring-2 focus:ring-river/10"
            {...register('name')}
          />
          {errors.name && (
            <span className="block text-xs text-red-600 mt-1" role="alert" aria-live="polite">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="mb-[18px]">
          <label htmlFor="contact-email" className="block text-xs font-medium text-text-primary mb-1.5 tracking-[0.3px]">
            Email
          </label>
          <input
            type="email"
            id="contact-email"
            placeholder="you@example.com"
            className="w-full px-4 py-[13px] border border-black/12 rounded-md font-body text-sm text-text-primary bg-white transition-all duration-300 outline-none focus:border-river focus:ring-2 focus:ring-river/10"
            {...register('email')}
          />
          {errors.email && (
            <span className="block text-xs text-red-600 mt-1" role="alert" aria-live="polite">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="mb-[18px]">
          <label htmlFor="contact-department" className="block text-xs font-medium text-text-primary mb-1.5 tracking-[0.3px]">
            Department
          </label>
          <select
            id="contact-department"
            defaultValue=""
            className="w-full px-4 py-[13px] border border-black/12 rounded-md font-body text-sm text-text-primary bg-white transition-all duration-300 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%270%200%2012%208%27%20fill%3D%27none%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201.5L6%206.5L11%201.5%27%20stroke%3D%27%235a5a52%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_14px_center] pr-9 focus:border-river focus:ring-2 focus:ring-river/10"
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
            <span className="block text-xs text-red-600 mt-1" role="alert" aria-live="polite">
              {errors.department.message}
            </span>
          )}
        </div>

        <div className="mb-[18px]">
          <label htmlFor="contact-message" className="block text-xs font-medium text-text-primary mb-1.5 tracking-[0.3px]">
            Message
          </label>
          <textarea
            id="contact-message"
            placeholder="How can we help?"
            rows={4}
            className="w-full px-4 py-[13px] border border-black/12 rounded-md font-body text-sm text-text-primary bg-white transition-all duration-300 outline-none resize-y min-h-20 focus:border-river focus:ring-2 focus:ring-river/10"
            {...register('message')}
          />
          {errors.message && (
            <span className="block text-xs text-red-600 mt-1" role="alert" aria-live="polite">
              {errors.message.message}
            </span>
          )}
        </div>

        {status === 'error' && (
          <p className="block text-xs text-red-600 mb-3" role="alert" aria-live="polite">
            Something went wrong. Please try again or email us directly.
          </p>
        )}

        <div className="mt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-[13px] rounded-full text-sm font-semibold text-white bg-forest transition-all duration-300 hover:bg-forest-deep hover:translate-y-[-2px] hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <svg className="size-[18px] animate-spin" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                Send Message
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

/* ──────────────── Footer ──────────────── */

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
                  { href: '/explore', label: 'Explore Waters' },
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
