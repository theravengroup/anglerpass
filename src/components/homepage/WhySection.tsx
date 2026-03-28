'use client';

import { useEffect, useRef } from 'react';

export default function WhySection() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.parentElement!.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - rect.top) / (vh + rect.height);
      el.style.transform = `translateY(${(p - 0.5) * -100}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="why" id="why">
      <div className="why-bg" id="whyBg" ref={bgRef} style={{ backgroundImage: "url('/images/patagonia.webp')" }}></div>
      <div className="why-overlay"></div>
      <div className="why-grain"></div>
      <div className="container">
        <div className="why-content reveal-left">
          <span className="eyebrow">Why This Matters</span>
          <h2>Bringing Structure to the Waters That Matter Most</h2>
          <p className="why-text">Private waters represent some of the best fly fishing on the planet. But the systems around them — scheduling, memberships, access management — haven't kept up with the quality of the experience.</p>
          <p className="why-text">AnglerPass exists to close that gap. By giving landowners, clubs, and anglers the tools they've been missing, we make private water access more organized, more sustainable, and more accessible to the right people.</p>
          <div className="why-list">
            <div className="why-list-item">
              <div className="why-list-icon">
                <svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
              </div>
              <div className="why-list-text">
                <h4>Preserve Quality Access</h4>
                <p>Help landowners maintain the integrity of their waters while opening controlled access.</p>
              </div>
            </div>
            <div className="why-list-item">
              <div className="why-list-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <div className="why-list-text">
                <h4>Modernize Operations</h4>
                <p>Give clubs real software to replace the patchwork of spreadsheets, texts, and emails.</p>
              </div>
            </div>
            <div className="why-list-item">
              <div className="why-list-icon">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div className="why-list-text">
                <h4>Elevate the Angler Experience</h4>
                <p>Make discovering and booking private waters as professional as the experience itself.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="why-visual reveal-right d2">
          <div className="why-visual-card">
            <div className="why-quote-line"></div>
            <div className="why-quote">The best fishing isn't about finding any water. It's about finding the right water — and earning access to it.</div>
            <div className="why-quote-attr">The AnglerPass Philosophy</div>
          </div>
        </div>
      </div>
    </section>
  );
}
