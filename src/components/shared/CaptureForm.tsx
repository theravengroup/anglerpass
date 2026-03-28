'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, type LeadFormData } from '@/lib/validations/leads';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CaptureFormProps {
  source?: string;
  defaultInterest?: LeadFormData['interestType'];
  leadType?: LeadFormData['type'];
  className?: string;
}

export default function CaptureForm({
  source,
  defaultInterest = 'angler',
  leadType = 'contact',
  className = '',
}: CaptureFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      interestType: defaultInterest,
      type: leadType,
      source: source ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Something went wrong. Please try again.');
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-xl border border-parchment bg-offwhite p-8 text-center ${className}`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest/10">
          <svg
            className="h-7 w-7 text-forest"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-heading text-2xl font-semibold text-forest">
          Thank you
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          We&apos;ve received your information and will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-5 rounded-xl border border-parchment bg-offwhite p-6 sm:p-8 ${className}`}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {/* First name */}
        <div className="space-y-1.5">
          <Label htmlFor="cap-firstName" className="text-text-primary">
            First name <span className="text-bronze">*</span>
          </Label>
          <Input
            id="cap-firstName"
            placeholder="John"
            className="border-parchment bg-white focus-visible:border-river focus-visible:ring-river/20"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last name */}
        <div className="space-y-1.5">
          <Label htmlFor="cap-lastName" className="text-text-primary">
            Last name
          </Label>
          <Input
            id="cap-lastName"
            placeholder="Doe"
            className="border-parchment bg-white focus-visible:border-river focus-visible:ring-river/20"
            {...register('lastName')}
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="cap-email" className="text-text-primary">
          Email <span className="text-bronze">*</span>
        </Label>
        <Input
          id="cap-email"
          type="email"
          placeholder="john@example.com"
          className="border-parchment bg-white focus-visible:border-river focus-visible:ring-river/20"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Interest type */}
      <div className="space-y-1.5">
        <Label className="text-text-primary">I am a...</Label>
        <Select
          defaultValue={defaultInterest}
          onValueChange={(val) =>
            setValue('interestType', val as LeadFormData['interestType'])
          }
        >
          <SelectTrigger className="w-full border-parchment bg-white focus-visible:border-river focus-visible:ring-river/20">
            <SelectValue placeholder="Select your interest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landowner">Landowner / Property Manager</SelectItem>
            <SelectItem value="club">Fishing Club / Organization</SelectItem>
            <SelectItem value="angler">Angler</SelectItem>
            <SelectItem value="investor">Investor</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="cap-message" className="text-text-primary">
          Message <span className="text-text-light">(optional)</span>
        </Label>
        <Textarea
          id="cap-message"
          rows={3}
          placeholder="Tell us about your property, club, or what you're looking for..."
          className="border-parchment bg-white focus-visible:border-river focus-visible:ring-river/20"
          {...register('message')}
        />
      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register('source')} />
      <input type="hidden" {...register('type')} />

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-forest py-5 text-base font-medium text-offwhite hover:bg-forest-deep disabled:opacity-50"
      >
        {isSubmitting ? 'Sending...' : 'Get in Touch'}
      </Button>
    </form>
  );
}
