'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function FinalCtaSection() {
  const bgRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  useEffect(() => {
    function parallax() {
      const bg = bgRef.current;
      if (!bg) return;
      const sec = bg.closest('section') ?? bg.closest('.final-cta');
      if (!sec) return;
      const h = window.innerHeight;
      const r = sec.getBoundingClientRect();
      const p = (h - r.top) / (h + r.height);
      if (p > -0.2 && p < 1.2) {
        bg.style.transform = `translate3d(0,${(p - 0.5) * -100}px,0)`;
      }
    }

    window.addEventListener('scroll', parallax, { passive: true });
    parallax();
    return () => window.removeEventListener('scroll', parallax);
  }, []);

  return (
    <section className="final-cta">
      <div className="final-cta-bg" id="finalCtaBg" ref={bgRef} style={{ backgroundImage: "url('/images/minnesota.webp')" }} />
      <div className="final-cta-overlay" />
      <div className="container">
        {isLoggedIn ? (
          <>
            <span className="eyebrow reveal">Welcome Back</span>
            <h2 className="reveal d1">Your Private Water Access Awaits</h2>
            <p className="reveal d2">Head to your dashboard to browse properties, manage bookings, and access your club network.</p>
            <div className="final-cta-buttons reveal d3">
              <a href="/dashboard" className="btn btn-white">Go to Dashboard <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              <a href="#" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-contact-modal')); }}>Contact Us Directly</a>
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow reveal">Be First</span>
            <h2 className="reveal d1">Help Shape the Future of Private Fly Fishing Access</h2>
            <p className="reveal d2">We&rsquo;re building AnglerPass for the people who understand this space best. Join the waitlist, get early access, and help us get it right from the start.</p>
            <div className="final-cta-buttons reveal d3">
              <a href="#waitlist" className="btn btn-white">Join the Waitlist <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              <a href="#" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-contact-modal')); }}>Contact Us Directly</a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
