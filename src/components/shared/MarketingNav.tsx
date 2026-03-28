'use client';

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/landowners', label: 'For Landowners' },
  { href: '/clubs', label: 'For Clubs' },
  { href: '/anglers', label: 'For Anglers' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 32px',
        transition: 'all .5s cubic-bezier(.22,1,.36,1)',
        background: scrolled ? 'rgba(250,249,245,.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.2)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-parchment)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,.04)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 72,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: scrolled ? 'var(--color-text-primary)' : '#fff',
            transition: 'color .4s',
          }}
        >
          <img
            src="/images/anglerpass-noword-logo.svg"
            alt=""
            style={{ height: 36, width: 'auto' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-.3px',
            }}
          >
            AnglerPass
          </span>
        </Link>

        {/* Desktop links */}
        <ul
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
          className="marketing-nav-links"
        >
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    textDecoration: 'none',
                    color: scrolled
                      ? active
                        ? 'var(--color-forest)'
                        : 'var(--color-text-secondary)'
                      : active
                        ? '#fff'
                        : 'rgba(255,255,255,.7)',
                    transition: 'color .3s',
                    letterSpacing: '.2px',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA */}
        <div className="marketing-nav-cta">
          <Link
            href="/#waitlist"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '.3px',
              textDecoration: 'none',
              cursor: 'pointer',
              border: 'none',
              transition: 'all .4s cubic-bezier(.22,1,.36,1)',
              background: 'var(--color-forest-deep)',
              color: '#fff',
            }}
          >
            Join Waitlist
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="marketing-mobile-toggle"
          aria-label="Menu"
          onClick={() => setMobileOpen((prev) => !prev)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: scrolled ? 'var(--color-text-primary)' : '#fff', margin: '5px 0', transition: 'all .3s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: scrolled ? 'var(--color-text-primary)' : '#fff', margin: '5px 0', transition: 'all .3s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: scrolled ? 'var(--color-text-primary)' : '#fff', margin: '5px 0', transition: 'all .3s' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: scrolled ? 'rgba(250,249,245,.98)' : 'rgba(15,34,25,.95)',
            backdropFilter: 'blur(20px)',
            padding: '20px 32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                padding: '12px 0',
                fontSize: 15,
                fontWeight: pathname === link.href ? 600 : 500,
                color: scrolled ? 'var(--color-text-primary)' : 'rgba(255,255,255,.85)',
                textDecoration: 'none',
                borderBottom: `1px solid ${scrolled ? 'var(--color-parchment)' : 'rgba(255,255,255,.08)'}`,
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#waitlist"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'block',
              padding: '12px 0',
              fontSize: 15,
              fontWeight: 500,
              color: scrolled ? 'var(--color-bronze)' : 'var(--color-bronze-light)',
              textDecoration: 'none',
            }}
          >
            Join Waitlist
          </Link>
        </div>
      )}
    </nav>
  );
}
