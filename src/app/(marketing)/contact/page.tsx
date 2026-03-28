import type { Metadata } from 'next';
import MarketingLayout from '@/components/shared/MarketingLayout';
import CaptureForm from '@/components/shared/CaptureForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the AnglerPass team. Whether you are a landowner, club, or angler, we would love to hear from you.',
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-forest pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="mb-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-bronze-light">
            Contact
          </span>
          <h1 className="font-heading text-4xl font-semibold text-parchment sm:text-5xl">
            Let&apos;s Start a Conversation
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-parchment/60">
            Whether you manage private water, run a club, or are looking for
            your next great fishing experience, we want to hear from you.
          </p>
        </div>
      </section>

      {/* Form section */}
      <section className="bg-parchment-light py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            {/* Left column: context */}
            <div>
              <h2 className="font-heading text-2xl font-semibold text-forest sm:text-3xl">
                How can we help?
              </h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                Fill out the form and we will get back to you within a couple of
                business days. For urgent inquiries, you can also reach us
                directly.
              </p>

              <div className="mt-10 space-y-6">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-bronze">
                    Email
                  </h3>
                  <a
                    href="mailto:hello@anglerpass.com"
                    className="mt-1 block text-forest transition-colors hover:text-river"
                  >
                    hello@anglerpass.com
                  </a>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-bronze">
                    Investors
                  </h3>
                  <a
                    href="mailto:investors@anglerpass.com"
                    className="mt-1 block text-forest transition-colors hover:text-river"
                  >
                    investors@anglerpass.com
                  </a>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-bronze">
                    Based in
                  </h3>
                  <p className="mt-1 text-text-secondary">
                    The American West
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: form */}
            <CaptureForm source="/contact" leadType="contact" />
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
