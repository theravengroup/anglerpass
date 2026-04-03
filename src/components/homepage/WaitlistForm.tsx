'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  email: z.email('Invalid email'),
  role: z.string().min(1, 'Required'),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setStatus('submitting');
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, interestType: data.role, type: 'waitlist' }),
      });
    } catch {
      // silently handle
    }
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        reset();
      }, 3000);
    }, 1500);
  };

  return (
    <div className="waitlist-form-wrapper reveal-right d1">
      <h3 className="waitlist-form-title">Join the Waitlist</h3>
      <p className="waitlist-form-sub">Be among the first to access AnglerPass when we launch.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" placeholder="James" required {...register('firstName')} />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" placeholder="Merritt" {...register('lastName')} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="james@example.com" required {...register('email')} />
        </div>
        <div className="form-group">
          <label htmlFor="role">I am a...</label>
          <select id="role" required defaultValue="" {...register('role')}>
            <option value="" disabled>Select your role</option>
            <option value="landowner">Landowner</option>
            <option value="angler">Individual Angler</option>
            <option value="club">Club or Association</option>
            <option value="guide">Guide</option>
            <option value="corporate">Corporate Member</option>
            <option value="partner">Partner</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <textarea id="message" placeholder="Tell us about your interest in AnglerPass..." {...register('message')} />
        </div>
        <div className="form-submit">
          <button type="submit" className="btn btn-primary" disabled={status !== 'idle'} style={status === 'success' ? { background: '#2a6b3a' } : undefined}>
            {status === 'submitting' && (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin .6s linear infinite' }}>
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8" />
                </svg>{' '}Joining...
              </>
            )}
            {status === 'success' && '\u2713 You\u2019re on the list!'}
            {status === 'idle' && (
              <>
                Join the Waitlist{' '}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
      <p className="form-partner">Questions? Reach us at <a href="mailto:hello@anglerpass.com">hello@anglerpass.com</a></p>
    </div>
  );
}
