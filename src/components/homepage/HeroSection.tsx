'use client';

import { useEffect, useRef } from 'react';
import HeroMockup from './HeroMockup';
import ScrollIndicator from './ScrollIndicator';

const headlineWords = [
  { text: 'Private', em: false },
  { text: 'Water', em: false },
  { text: 'Access,', em: false },
  { text: 'Modernized.', em: true },
];

export default function HeroSection() {
  const heroBgImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (heroBgImgRef.current) {
        const scrollY = window.scrollY;
        heroBgImgRef.current.style.transform = `translate3d(0, ${scrollY * 0.35}px, 0) scale(1.05)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={heroBgImgRef}
          src="/images/hero.webp"
          alt="Fly fishing at sunrise on a private Rocky Mountain river"
          id="heroBgImg"
          style={{ width: '100%', height: '120%', objectFit: 'cover', objectPosition: 'center 40%', willChange: 'transform', transform: 'scale(1.05)' }}
        />
        <div className="hero-bg-overlay"></div>
        <div className="hero-bg-grain"></div>
      </div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            <span>Now Building AnglerPass</span>
          </div>
          <h1 id="heroHeadline">
            {headlineWords.map((word, i) => {
              const delay = `${0.3 + i * 0.08}s`;
              const span = (
                <span
                  key={i}
                  className="hero-word"
                  style={{ animationDelay: delay }}
                >
                  {word.text}
                </span>
              );
              if (word.em) {
                return <em key={i}>{span} </em>;
              }
              return <span key={i}>{span} </span>;
            })}
          </h1>
          <p className="hero-sub">
            The operating platform for private fly fishing access. Clubs vet
            anglers, landowners trust the network, and everyone gets access to
            better water — all in one place.
          </p>
          <div className="hero-ctas">
            <a href="#waitlist" className="btn btn-primary">
              Join the Waitlist{' '}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3 8h10m0 0L9 4m4 4L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#how" className="btn btn-secondary">
              How It Works
            </a>
          </div>
          <p className="hero-note">
            <svg viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M8 5v3.5l2.5 1.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>{' '}
            Platform under active development. Early supporters get priority
            access.
          </p>
        </div>
        <HeroMockup />
      </div>
      <ScrollIndicator />
    </section>
  );
}
