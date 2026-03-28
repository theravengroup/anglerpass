'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email'),
  investorType: z.string().min(1, 'Required'),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function InvestorForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setStatus('submitting');
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'investor' }),
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
    <div className="reveal-right d2" id="investor-form">
      <div className="investor-form-wrap">
        <h3>Request the Pitch Deck</h3>
        <p className="form-sub">Share your details and we&rsquo;ll send the full investor deck within 24 hours.</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invFirstName">First Name</label>
              <input type="text" id="invFirstName" placeholder="Jane" required {...register('firstName')} />
            </div>
            <div className="form-group">
              <label htmlFor="invLastName">Last Name</label>
              <input type="text" id="invLastName" placeholder="Chen" {...register('lastName')} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="invEmail">Email</label>
            <input type="email" id="invEmail" placeholder="jane@fund.com" required {...register('email')} />
          </div>
          <div className="form-group">
            <label htmlFor="invType">Investor Type</label>
            <select id="invType" required defaultValue="" {...register('investorType')}>
              <option value="" disabled>Select type</option>
              <option value="angel">Angel Investor</option>
              <option value="vc">Venture Capital</option>
              <option value="family-office">Family Office</option>
              <option value="strategic">Strategic / Industry</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="invMessage">Message <span style={{ fontWeight: 400, color: 'rgba(255,255,255,.3)' }}>(optional)</span></label>
            <textarea id="invMessage" placeholder="What drew your interest in AnglerPass?" {...register('message')} />
          </div>
          <div className="form-submit">
            <button type="submit" className="btn btn-bronze" disabled={status !== 'idle'} style={status === 'success' ? { background: '#2a6b3a' } : undefined}>
              {status === 'submitting' && (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin .6s linear infinite' }}>
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8" />
                  </svg>{' '}Sending...
                </>
              )}
              {status === 'success' && '\u2713 Deck request received!'}
              {status === 'idle' && (
                <>
                  Request the Deck{' '}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
