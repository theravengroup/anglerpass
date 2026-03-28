'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        setMobileOpen(false);
      }
    },
    []
  );

  return (
    <nav id="mainNav" className={scrolled ? 'scrolled' : ''}>
      <div className="nav-inner">
        <a
          href="#hero"
          className="nav-logo"
          onClick={(e) => handleAnchorClick(e, '#hero')}
        >
          <img src="/images/anglerpass-noword-logo.svg" alt="" style={{ height: 36, width: 'auto' }} />
          <span className="nav-logo-text">AnglerPass</span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="#problem" onClick={(e) => handleAnchorClick(e, '#problem')}>
              The Opportunity
            </a>
          </li>
          <li>
            <a href="#how" onClick={(e) => handleAnchorClick(e, '#how')}>
              How It Works
            </a>
          </li>
          <li>
            <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')}>
              Features
            </a>
          </li>
          <li>
            <a href="#why" onClick={(e) => handleAnchorClick(e, '#why')}>
              Why It Matters
            </a>
          </li>
          <li>
            <a href="#built-for" onClick={(e) => handleAnchorClick(e, '#built-for')}>
              Who It&apos;s For
            </a>
          </li>
          <li>
            <a href="#faq" onClick={(e) => handleAnchorClick(e, '#faq')}>
              FAQ
            </a>
          </li>
          <li className="nav-dropdown">
            <a href="#investors" onClick={(e) => handleAnchorClick(e, '#investors')}>
              Investors{' '}
              <svg viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <div className="nav-dropdown-menu">
              <a
                href="#investors"
                onClick={(e) => handleAnchorClick(e, '#investors')}
              >
                Investment Overview
              </a>
              <a
                href="#investor-form"
                onClick={(e) => handleAnchorClick(e, '#investor-form')}
              >
                Request the Deck
              </a>
              <div className="dd-divider"></div>
              <Link href="mailto:investors@anglerpass.com">Contact Directly</Link>
            </div>
          </li>
        </ul>
        <div className="nav-cta">
          <a
            href="#waitlist"
            className="btn btn-primary"
            onClick={(e) => handleAnchorClick(e, '#waitlist')}
          >
            Join the Waitlist
          </a>
        </div>
        <button
          className="mobile-toggle"
          aria-label="Menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      {mobileOpen && (
        <div
          style={{
            background: scrolled ? 'rgba(250,249,245,.98)' : 'rgba(15,34,25,.95)',
            backdropFilter: 'blur(20px)',
            padding: '20px 32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {[
            { href: '#problem', label: 'The Opportunity' },
            { href: '#how', label: 'How It Works' },
            { href: '#features', label: 'Features' },
            { href: '#why', label: 'Why It Matters' },
            { href: '#built-for', label: "Who It's For" },
            { href: '#faq', label: 'FAQ' },
            { href: '#investors', label: 'Investors' },
            { href: '#waitlist', label: 'Join the Waitlist' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.href)}
              style={{
                display: 'block',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: 500,
                color: scrolled ? 'var(--text-primary)' : 'rgba(255,255,255,.85)',
                textDecoration: 'none',
                borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'rgba(255,255,255,.08)'}`,
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
