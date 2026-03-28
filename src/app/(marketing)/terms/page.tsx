import type { Metadata } from 'next';
import MarketingLayout from '@/components/shared/MarketingLayout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AnglerPass terms of service.',
};

export default function TermsPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-forest pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-heading text-4xl font-semibold text-parchment sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-parchment/60">
            Last updated: March 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-offwhite py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="prose prose-lg max-w-none">
            <div className="rounded-xl border border-parchment bg-white p-8 sm:p-12">
              <p className="text-text-secondary leading-relaxed">
                Our terms of service are currently being finalized as we prepare
                for the AnglerPass platform launch. The full terms will be
                published before the platform is made available to users.
              </p>

              <h2 className="mt-8 font-heading text-2xl font-semibold text-forest">
                What to Expect
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                When published, our terms of service will cover the following
                areas:
              </p>
              <ul className="mt-4 space-y-3 text-text-secondary">
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    1
                  </span>
                  <span>
                    Account creation, usage rights, and responsibilities for
                    landowners, clubs, and anglers.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    2
                  </span>
                  <span>
                    Property listing guidelines, access terms, and booking
                    policies.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    3
                  </span>
                  <span>
                    Payment terms, cancellation policies, and dispute resolution
                    procedures.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    4
                  </span>
                  <span>
                    Intellectual property rights and content ownership.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    5
                  </span>
                  <span>
                    Limitation of liability and governing jurisdiction.
                  </span>
                </li>
              </ul>

              <h2 className="mt-8 font-heading text-2xl font-semibold text-forest">
                Questions?
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                If you have questions about our upcoming terms of service, please
                contact us at{' '}
                <a
                  href="mailto:hello@anglerpass.com"
                  className="text-river hover:text-river-light"
                >
                  hello@anglerpass.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
