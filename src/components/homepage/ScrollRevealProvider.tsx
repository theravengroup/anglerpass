'use client';

import { useEffect, useCallback, type ReactNode } from 'react';

export default function ScrollRevealProvider({ children }: { children: ReactNode }) {
  const revealInViewport = useCallback(() => {
    const vh = window.innerHeight;
    document
      .querySelectorAll(
        '.reveal:not(.visible),.reveal-left:not(.visible),.reveal-right:not(.visible),.reveal-scale:not(.visible)'
      )
      .forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Trigger when element top enters viewport minus 60px offset
        if (rect.top < vh - 60 && rect.bottom > 0) {
          el.classList.add('visible');
        }
      });
  }, []);

  useEffect(() => {
    // Use IntersectionObserver when available and reliable,
    // with scroll listener as guaranteed fallback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    function observeAll() {
      document
        .querySelectorAll(
          '.reveal:not(.visible),.reveal-left:not(.visible),.reveal-right:not(.visible),.reveal-scale:not(.visible)'
        )
        .forEach((el) => {
          observer.observe(el);
        });
    }

    // Observe after paint
    requestAnimationFrame(() => {
      observeAll();
      // Also run scroll-based check as fallback
      revealInViewport();
    });

    // Scroll listener as reliable fallback
    window.addEventListener('scroll', revealInViewport, { passive: true });

    // Re-observe on DOM changes (for dynamically rendered content)
    const mutationObserver = new MutationObserver(() => {
      observeAll();
      revealInViewport();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', revealInViewport);
    };
  }, [revealInViewport]);

  return <>{children}</>;
}
