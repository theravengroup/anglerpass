'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  contactSchema,
  CONTACT_DEPARTMENTS,
  type ContactFormData,
} from '@/lib/validations/contact';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

export default function ContactForm({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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
        body: JSON.stringify({ ...data, turnstileToken }),
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

        <div className="mt-3">
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>

        <div className="mt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-[13px] rounded-full text-sm font-semibold text-white bg-forest transition-all duration-300 hover:bg-forest-deep hover:translate-y-[-2px] hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            disabled={status === 'submitting' || !turnstileToken}
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
