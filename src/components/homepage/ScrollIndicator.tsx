'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ScrollIndicator() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setHidden(window.scrollY > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = useCallback(() => {
    const el = document.querySelector('#problem');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    <div
      className={`scroll-indicator${hidden ? ' hidden' : ''}`}
      id="scrollIndicator"
      onClick={handleClick}
    >
      <span className="scroll-label">Explore</span>
      <div className="scroll-mouse">
        <div className="scroll-wheel"></div>
      </div>
      <svg
        className="scroll-chevrons"
        width="16"
        height="18"
        viewBox="0 0 16 18"
        fill="none"
      >
        <path
          className="chevron-1"
          d="M1 1L8 8L15 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="chevron-2"
          d="M1 6L8 13L15 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
