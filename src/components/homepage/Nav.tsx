'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { anchor: '#problem', label: 'The Opportunity' },
  { anchor: '#how', label: 'How It Works' },
  { anchor: '#compass', label: 'Compass' },
  { anchor: '#features', label: 'Features' },
  { anchor: '#why', label: 'Why It Matters' },
  { anchor: '#built-for', label: "Who It's For" },
  { anchor: '#faq', label: 'FAQ' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === '/';

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
        {isHomepage ? (
          <a
            href="#hero"
            className="nav-logo"
            onClick={(e) => handleAnchorClick(e, '#hero')}
          >
            <img src="/images/anglerpass-noword-logo.svg" alt="" style={{ height: 36, width: 'auto' }} />
            <span className="nav-logo-text">AnglerPass</span>
          </a>
        ) : (
          <Link href="/" className="nav-logo">
            <img src="/images/anglerpass-noword-logo.svg" alt="" style={{ height: 36, width: 'auto' }} />
            <span className="nav-logo-text">AnglerPass</span>
          </Link>
        )}
        <ul className="nav-links">
          {navLinks.map((item) => (
            <li key={item.anchor}>
              {isHomepage ? (
                <a href={item.anchor} onClick={(e) => handleAnchorClick(e, item.anchor)}>
                  {item.label}
                </a>
              ) : (
                <Link href={`/${item.anchor}`}>{item.label}</Link>
              )}
            </li>
          ))}
          <li className="nav-dropdown">
            {isHomepage ? (
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
            ) : (
              <Link href="/#investors">
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
              </Link>
            )}
            <div className="nav-dropdown-menu">
              {isHomepage ? (
                <>
                  <a href="#investors" onClick={(e) => handleAnchorClick(e, '#investors')}>
                    Investment Overview
                  </a>
                  <a href="#investor-form" onClick={(e) => handleAnchorClick(e, '#investor-form')}>
                    Request the Snapshot
                  </a>
                </>
              ) : (
                <>
                  <Link href="/#investors">Investment Overview</Link>
                  <Link href="/#investor-form">Request the Snapshot</Link>
                </>
              )}
              <div className="dd-divider"></div>
              <Link href="mailto:investors@anglerpass.com">Contact Directly</Link>
            </div>
          </li>
        </ul>
        <div className="nav-cta">
          <a href="/login" className="btn btn-login">Log In</a>
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
          {[...navLinks, { anchor: '#investors', label: 'Investors' }, { anchor: '/login', label: 'Log In' }].map((item) =>
            isHomepage ? (
              <a
                key={item.anchor}
                href={item.anchor}
                onClick={(e) => {
                  handleAnchorClick(e, item.anchor);
                  if (!item.anchor.startsWith('#')) setMobileOpen(false);
                }}
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
            ) : (
              <Link
                key={item.anchor}
                href={item.anchor.startsWith('#') ? `/${item.anchor}` : item.anchor}
                onClick={() => setMobileOpen(false)}
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
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
