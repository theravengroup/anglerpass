'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  corporateInquirySchema,
  EMPLOYEE_COUNT_OPTIONS,
  USE_CASE_OPTIONS,
  TIMELINE_OPTIONS,
  REGION_OPTIONS,
  type CorporateInquiryData,
} from '@/lib/validations/corporate-inquiry';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

const selectArrow =
  "bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%270%200%2012%208%27%20fill%3D%27none%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201.5L6%206.5L11%201.5%27%20stroke%3D%27%235a5a52%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_14px_center]";

const inputClass =
  'w-full px-4 py-[13px] border border-black/12 rounded-md font-body text-sm text-text-primary bg-white transition-all duration-300 outline-none focus:border-river focus:ring-2 focus:ring-river/10';
const labelClass =
  'block text-xs font-medium text-text-primary mb-1.5 tracking-[0.3px]';
const errorClass = 'block text-xs text-red-600 mt-1';

export default function CorporateInquiryForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  );
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorporateInquiryData>({
    resolver: zodResolver(corporateInquirySchema),
    defaultValues: {
      regions: [],
    },
  });

  const onSubmit = async (data: CorporateInquiryData) => {
    setStatus('submitting');
    try {
      const res = await fetch('/api/leads/corporate', {
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
      setTimeout(() => onSuccess(), 3500);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-forest/10 text-forest">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="mt-3 text-[14.5px] leading-[1.7] text-text-secondary">
          Inquiry received. A member of our corporate team will reach out within
          1 business&nbsp;day.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[14.5px] leading-[1.7] text-text-secondary mb-5">
        Tell us a little about your company and we&rsquo;ll tailor a corporate
        membership proposal. We typically respond within 1 business&nbsp;day.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3 mb-[18px]">
          <div>
            <label htmlFor="ci-company" className={labelClass}>
              Company name
            </label>
            <input
              type="text"
              id="ci-company"
              placeholder="Acme Inc."
              className={inputClass}
              {...register('companyName')}
            />
            {errors.companyName && (
              <span className={errorClass} role="alert" aria-live="polite">
                {errors.companyName.message}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="ci-contact" className={labelClass}>
              Your name
            </label>
            <input
              type="text"
              id="ci-contact"
              placeholder="Jane Doe"
              className={inputClass}
              {...register('contactName')}
            />
            {errors.contactName && (
              <span className={errorClass} role="alert" aria-live="polite">
                {errors.contactName.message}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-[18px]">
          <div>
            <label htmlFor="ci-email" className={labelClass}>
              Work email
            </label>
            <input
              type="email"
              id="ci-email"
              placeholder="jane@acme.com"
              className={inputClass}
              {...register('workEmail')}
            />
            {errors.workEmail && (
              <span className={errorClass} role="alert" aria-live="polite">
                {errors.workEmail.message}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="ci-phone" className={labelClass}>
              Phone <span className="text-text-light">(optional)</span>
            </label>
            <input
              type="tel"
              id="ci-phone"
              placeholder="(555) 555-5555"
              className={inputClass}
              {...register('phone')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-[18px]">
          <div>
            <label htmlFor="ci-size" className={labelClass}>
              Company size
            </label>
            <select
              id="ci-size"
              defaultValue=""
              className={`${inputClass} ${selectArrow} appearance-none cursor-pointer pr-9`}
              {...register('employeeCount')}
            >
              <option value="" disabled>
                Select size
              </option>
              {EMPLOYEE_COUNT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {errors.employeeCount && (
              <span className={errorClass} role="alert" aria-live="polite">
                {errors.employeeCount.message}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="ci-members" className={labelClass}>
              Est. employees to invite
            </label>
            <input
              type="number"
              id="ci-members"
              placeholder="25"
              min={1}
              className={inputClass}
              {...register('estimatedMembers')}
            />
            {errors.estimatedMembers && (
              <span className={errorClass} role="alert" aria-live="polite">
                {errors.estimatedMembers.message}
              </span>
            )}
          </div>
        </div>

        <div className="mb-[18px]">
          <label htmlFor="ci-usecase" className={labelClass}>
            Primary use case
          </label>
          <select
            id="ci-usecase"
            defaultValue=""
            className={`${inputClass} ${selectArrow} appearance-none cursor-pointer pr-9`}
            {...register('useCase')}
          >
            <option value="" disabled>
              Select a use case
            </option>
            {USE_CASE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.useCase && (
            <span className={errorClass} role="alert" aria-live="polite">
              {errors.useCase.message}
            </span>
          )}
        </div>

        <div className="mb-[18px]">
          <span className={labelClass}>Regions of interest</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {REGION_OPTIONS.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={r.value}
                  className="size-4 rounded border-black/20 text-river focus:ring-river/20"
                  {...register('regions')}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
          {errors.regions && (
            <span className={errorClass} role="alert" aria-live="polite">
              {errors.regions.message}
            </span>
          )}
        </div>

        <div className="mb-[18px]">
          <label htmlFor="ci-timeline" className={labelClass}>
            Timeline
          </label>
          <select
            id="ci-timeline"
            defaultValue=""
            className={`${inputClass} ${selectArrow} appearance-none cursor-pointer pr-9`}
            {...register('timeline')}
          >
            <option value="" disabled>
              Select timeline
            </option>
            {TIMELINE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.timeline && (
            <span className={errorClass} role="alert" aria-live="polite">
              {errors.timeline.message}
            </span>
          )}
        </div>

        <div className="mb-[18px]">
          <label htmlFor="ci-notes" className={labelClass}>
            Anything else? <span className="text-text-light">(optional)</span>
          </label>
          <textarea
            id="ci-notes"
            placeholder="Tell us about your goals, preferred clubs, or specific questions."
            rows={3}
            className={`${inputClass} resize-y min-h-16`}
            {...register('notes')}
          />
        </div>

        {status === 'error' && (
          <p className="block text-xs text-red-600 mb-3" role="alert" aria-live="polite">
            Something went wrong. Please try again or email partners@anglerpass.com directly.
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
                  <circle
                    cx="9"
                    cy="9"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="32"
                    strokeDashoffset="8"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                Request Corporate Proposal
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10m0 0L9 4m4 4L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
