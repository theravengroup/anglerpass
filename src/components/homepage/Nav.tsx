'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { anchor: '#problem', label: 'The Problem' },
  { anchor: '#how', label: 'How It Works' },
  { anchor: '#features', label: 'Features' },
  { anchor: '#ai', label: 'AnglerPass AI' },
  { anchor: '#why', label: 'Our Approach' },
  { anchor: '#built-for', label: "Who It's For" },
  { anchor: '#faq', label: 'FAQ' },
];

interface UserInfo {
  firstName: string;
  lastName: string;
  initials: string;
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHomepage = pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Check auth state
  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const meta = session.user.user_metadata ?? {};
        const firstName = (meta.first_name || meta.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || '').trim();
        const lastName = (meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || '').trim();
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || firstName.charAt(0).toUpperCase() || '?';
        setUser({ firstName, lastName, initials });
      } else {
        setUser(null);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata ?? {};
        const firstName = (meta.first_name || meta.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || '').trim();
        const lastName = (meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || '').trim();
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || firstName.charAt(0).toUpperCase() || '?';
        setUser({ firstName, lastName, initials });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarOpen]);

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      setMobileOpen(false);
    }
  }

  async function handleSignOut() {
    setAvatarOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav id="mainNav" className={scrolled || !isHomepage ? 'scrolled' : ''}>
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
          <Link href="/explore" className="btn btn-login">Explore Waters</Link>
          {user ? (
            <div className="nav-avatar-wrap" ref={avatarRef} onClick={() => setAvatarOpen((prev) => !prev)}>
              <span className="nav-avatar-name">{user.firstName}</span>
              <div className="nav-avatar" aria-label="Account menu">
                {user.initials}
              </div>
              <div className={`nav-avatar-dropdown${avatarOpen ? ' open' : ''}`}>
                <Link href="/dashboard" onClick={() => setAvatarOpen(false)}>Dashboard</Link>
                <Link href="/dashboard/settings" onClick={() => setAvatarOpen(false)}>Account Settings</Link>
                <div className="nav-avatar-divider" />
                <button type="button" onClick={handleSignOut}>Log Out</button>
              </div>
            </div>
          ) : (
            <a href="/login" className="btn btn-login">Log In</a>
          )}
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
            ...navLinks,
            { anchor: '#investors', label: 'Investors' },
            { anchor: '/explore', label: 'Explore Waters' },
            ...(user
              ? [
                  { anchor: '/dashboard', label: 'Dashboard' },
                  { anchor: '/dashboard/settings', label: 'Account Settings' },
                ]
              : [{ anchor: '/login', label: 'Log In' }]),
          ].map((item) =>
            isHomepage && item.anchor.startsWith('#') ? (
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
          {user && (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleSignOut();
              }}
              style={{
                display: 'block',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: 500,
                color: scrolled ? 'var(--text-primary)' : 'rgba(255,255,255,.85)',
                textDecoration: 'none',
                border: 'none',
                borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'rgba(255,255,255,.08)'}`,
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'var(--font-body)',
              }}
            >
              Log Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
