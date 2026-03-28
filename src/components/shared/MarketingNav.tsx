'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import AnglerPassLogo from '@/components/icons/AnglerPassLogo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/landowners', label: 'For Landowners' },
  { href: '/clubs', label: 'For Clubs' },
  { href: '/anglers', label: 'For Anglers' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-offwhite/95 backdrop-blur-md shadow-sm border-b border-parchment'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <AnglerPassLogo
            className={`h-7 w-7 transition-colors duration-300 ${
              scrolled ? 'text-forest' : 'text-offwhite'
            }`}
          />
          <span
            className={`font-heading text-xl font-semibold tracking-tight transition-colors duration-300 ${
              scrolled ? 'text-forest' : 'text-offwhite'
            }`}
          >
            AnglerPass
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    scrolled
                      ? active
                        ? 'text-forest'
                        : 'text-text-secondary hover:text-forest'
                      : active
                        ? 'text-white'
                        : 'text-white/75 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link href="/#waitlist">
            <Button
              className={`rounded-full px-5 text-sm font-medium transition-all duration-300 ${
                scrolled
                  ? 'bg-forest text-offwhite hover:bg-forest-deep'
                  : 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 border border-white/20'
              }`}
            >
              Join Waitlist
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className={`rounded-md p-2 transition-colors ${
                  scrolled ? 'text-forest' : 'text-white'
                }`}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-l-parchment bg-offwhite"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-heading text-lg text-forest">
                  <AnglerPassLogo className="h-6 w-6 text-forest" />
                  AnglerPass
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-4">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-parchment text-forest'
                          : 'text-text-secondary hover:bg-parchment-light hover:text-forest'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="mt-4 border-t border-parchment pt-4">
                  <Link href="/#waitlist" onClick={() => setOpen(false)}>
                    <Button className="w-full rounded-full bg-forest text-offwhite hover:bg-forest-deep">
                      Join Waitlist
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
