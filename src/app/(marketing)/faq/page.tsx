import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingLayout from '@/components/shared/MarketingLayout';
import FaqAccordion from './FaqAccordion';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about AnglerPass, the operating platform for private fly fishing access.',
};

export default function FaqPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-forest pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="mb-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze-light">
            Questions
          </span>
          <h1 className="font-heading text-4xl font-semibold text-parchment sm:text-5xl">
            Frequently Asked
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-parchment/60">
            Everything you need to know about AnglerPass, from what it is to how
            you can get involved.
          </p>
        </div>
      </section>

      {/* FAQ content */}
      <section className="bg-offwhite py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <FaqAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-parchment-light py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-heading text-2xl font-semibold text-forest sm:text-3xl">
            Still have questions?
          </h2>
          <p className="mt-3 text-text-secondary">
            We&apos;d love to hear from you. Reach out and we&apos;ll get back to
            you as soon as we can.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact">
              <Button className="rounded-full bg-forest px-8 py-5 text-base font-medium text-offwhite hover:bg-forest-deep">
                Contact Us
              </Button>
            </Link>
            <Link href="/#waitlist">
              <Button
                variant="outline"
                className="rounded-full border-forest/20 px-8 py-5 text-base font-medium text-forest hover:bg-forest/5"
              >
                Join the Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
