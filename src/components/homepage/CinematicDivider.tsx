'use client';

import { useEffect, useRef } from 'react';

export default function CinematicDivider() {
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
    <div className="cinematic-divider">
      <div
        className="cinematic-divider-bg"
        id="dividerBg"
        ref={bgRef}
        style={{ backgroundImage: "url('/images/virginia.webp')", filter: 'brightness(.35) saturate(1.1)' }}
      ></div>
      <div className="cinematic-divider-overlay"></div>
      <div className="cinematic-divider-content reveal">
        <div className="divider-line"></div>
        <span className="eyebrow">The AnglerPass Philosophy</span>
        <h2>The best fishing isn't about finding any water. It's about finding the right water — and earning access to it.</h2>
      </div>
    </div>
  );
}
