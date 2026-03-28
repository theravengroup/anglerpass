import type { Metadata } from 'next';
import MarketingLayout from '@/components/shared/MarketingLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AnglerPass privacy policy.',
};

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-forest pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-heading text-4xl font-semibold text-parchment sm:text-5xl">
            Privacy Policy
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
                Our privacy policy is currently being finalized as we prepare for
                the AnglerPass platform launch. We are committed to protecting
                the privacy and security of all user data.
              </p>

              <h2 className="mt-8 font-heading text-2xl font-semibold text-forest">
                Our Commitment
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                AnglerPass takes data privacy seriously. When the platform
                launches, our privacy policy will detail how we collect, use,
                store, and protect your personal information. Key principles that
                will guide our policy include:
              </p>
              <ul className="mt-4 space-y-3 text-text-secondary">
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    1
                  </span>
                  <span>
                    Your personal information will never be sold to third parties.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    2
                  </span>
                  <span>
                    Landowners retain full control over the visibility and
                    distribution of their property information.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    3
                  </span>
                  <span>
                    All data will be stored securely with industry-standard
                    encryption.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest text-xs">
                    4
                  </span>
                  <span>
                    You will always have the ability to request, export, or
                    delete your data.
                  </span>
                </li>
              </ul>

              <h2 className="mt-8 font-heading text-2xl font-semibold text-forest">
                Questions?
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                If you have any questions about our approach to privacy, please
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
