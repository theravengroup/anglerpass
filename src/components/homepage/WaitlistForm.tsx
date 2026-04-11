'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TurnstileWidget from '@/components/shared/TurnstileWidget';
import { createClient } from '@/lib/supabase/client';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

const ROLE_QUESTIONS: Record<string, { label: string; placeholder: string }> = {
  angler: {
    label: "What's your biggest frustration with accessing private water today?",
    placeholder: 'e.g. Hard to find, too expensive, don\u2019t know anyone with access...',
  },
  landowner: {
    label: 'Do you currently allow fishing on your property?',
    placeholder: 'e.g. Yes through a local club, informally with friends, not yet...',
  },
  club: {
    label: 'How many members does your club currently have?',
    placeholder: 'e.g. 45 members, just getting started...',
  },
  guide: {
    label: 'How many years have you been guiding and where?',
    placeholder: 'e.g. 12 years on the Madison and Yellowstone...',
  },
  corporate: {
    label: 'What company are you with?',
    placeholder: 'e.g. Acme Corp',
  },
  partner: {
    label: 'What type of partnership are you interested in?',
    placeholder: 'e.g. Lodge referrals, gear brand, conservation org...',
  },
};

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  email: z.email('Invalid email'),
  role: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  roleResponse: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const meta = session.user.user_metadata ?? {};
        setUserName(meta.first_name || meta.display_name || '');
      }
    });
  }, []);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedRole = watch('role');
  const roleQuestion = selectedRole ? ROLE_QUESTIONS[selectedRole] : null;

  const onSubmit = async (data: FormData) => {
    setStatus('submitting');
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          interestType: data.role,
          type: 'waitlist',
          turnstileToken,
        }),
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

  if (isLoggedIn) {
    return (
      <div className="waitlist-form-wrapper reveal-right d1">
        <h3 className="waitlist-form-title">
          {userName ? `Welcome back, ${userName}` : 'Welcome back'}
        </h3>
        <p className="waitlist-form-sub">
          You already have an AnglerPass account. Head to your dashboard to get started.
        </p>
        <div className="form-submit">
          <a href="/dashboard" className="btn btn-primary">
            Go to Dashboard{' '}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

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
        <div className="form-row">
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
            <label htmlFor="state">What state are you in?</label>
            <select id="state" required defaultValue="" {...register('state')}>
              <option value="" disabled>Select your state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        {roleQuestion && (
          <div className="form-group">
            <label htmlFor="roleResponse">{roleQuestion.label}</label>
            <textarea
              id="roleResponse"
              placeholder={roleQuestion.placeholder}
              {...register('roleResponse')}
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="message">Anything else? <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <textarea id="message" placeholder="Tell us about your interest in AnglerPass..." {...register('message')} />
        </div>
        <div className="form-group">
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>
        <div className="form-submit">
          <button type="submit" className="btn btn-primary" disabled={status !== 'idle' || !turnstileToken} style={status === 'success' ? { background: '#2a6b3a' } : undefined}>
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
      <p className="form-partner">Questions? Reach us at <a href="mailto:hello@anglerpass.com">hello@anglerpass.com</a> or <a href="tel:+13035861008">303-586-1008</a></p>
    </div>
  );
}
