'use client';

import { useState, useEffect } from 'react';

export default function FloatingCta() {
  const [visible, setVisible] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const el = document.querySelector('#waitlist');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  useEffect(() => {
    const hero = document.getElementById('hero');
    const finalCta = document.querySelector('.final-cta');
    if (!hero || !finalCta) return;

    function check() {
      const heroRect = hero!.getBoundingClientRect();
      const finalRect = finalCta!.getBoundingClientRect();
      const pastHero = heroRect.bottom < 0;
      const reachedFinal = finalRect.top < window.innerHeight;
      setVisible(pastHero && !reachedFinal);
    }

    window.addEventListener('scroll', check, { passive: true });
    check();

    return () => window.removeEventListener('scroll', check);
  }, []);

  return (
    <a
      href="#waitlist"
      className={`floating-cta btn btn-primary${visible ? ' floating-cta-visible' : ''}`}
      onClick={handleClick}
    >
      Join the Waitlist
    </a>
  );
}
