import type { Metadata } from 'next';
import Link from 'next/link';
import AudienceFaqAccordion from '@/components/shared/AudienceFaqAccordion';
import DashboardPreviewSection from '@/components/shared/DashboardPreviewSection';

export const metadata: Metadata = {
  title: 'For Guides — AnglerPass',
  description:
    'Guide on private water. Build your client base, manage availability, and earn more with AnglerPass — the platform for professional fly fishing guides.',
  openGraph: {
    title: 'For Guides — AnglerPass',
    description:
      'Guide on private water. Build your client base, manage availability, and earn more with AnglerPass.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Guides — AnglerPass',
    description:
      'Guide on private water. Build your client base, manage availability, and earn more with AnglerPass.',
  },
};

const features = [
  {
    title: 'Access Private Water',
    description:
      'Get approved to guide on exclusive club waters and private stretches that most guides never see. Build relationships with landowners and clubs through a trusted platform.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    title: 'Instant Bookings',
    description:
      'Anglers book you directly when they add a guide to their trip. No back-and-forth, no phone tag. Confirmed bookings land in your dashboard immediately.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Manage Your Calendar',
    description:
      'Set your availability with a visual calendar. Block off dates, see booked days at a glance, and stay in control of your schedule.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Build Your Reputation',
    description:
      'Earn reviews from anglers you guide. Your rating, specialties, and credentials are showcased when anglers browse available guides for their trip.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'In-App Messaging',
    description:
      'Communicate with anglers and club admins directly through the platform. Coordinate trip details, share local knowledge, and build client relationships.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    title: 'Track Your Earnings',
    description:
      'See your earnings in real time — this month, this year, all time. Clear breakdown of guide rates, service fees, and payouts.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Create Your Profile',
    description: 'Create your profile, add your techniques, species specialties, location, and set your rates. Upload your guide license, insurance, and first aid certification.',
  },
  {
    step: '02',
    title: 'Get Verified',
    description: 'Our team reviews your credentials. Once approved, your profile is visible to anglers across the platform.',
  },
  {
    step: '03',
    title: 'Request Water Access',
    description: 'Browse available properties and request approval from clubs to guide on their waters. Build your network of approved locations.',
  },
  {
    step: '04',
    title: 'Get Booked',
    description: 'When anglers book a trip on water you\'re approved for, they can add you as their guide. You get notified instantly and the trip appears in your dashboard.',
  },
];

const requirements = [
  'Valid state guide license',
  'Professional liability insurance',
  'Current first aid certification',
  'Clean background (verified by AnglerPass)',
];

const faqs = [
  {
    q: 'How much does it cost to join as a guide?',
    a: 'There is no upfront cost or subscription fee. AnglerPass adds a 10% service fee on top of your guide rate, paid by the angler. You receive 100% of your stated rate.',
  },
  {
    q: 'How do I get approved for specific waters?',
    a: 'Once your profile is verified, you can request access to any property on the platform. The club or landowner managing that water reviews your credentials and decides whether to approve you.',
  },
  {
    q: 'Can I set my own rates?',
    a: 'Absolutely. You set your full-day and half-day rates. You can also adjust rates by property if needed.',
  },
  {
    q: 'How do I get paid?',
    a: 'Payouts are processed through Stripe Connect. After each completed trip, your guide rate is deposited directly to your bank account.',
  },
  {
    q: 'What if an angler cancels?',
    a: 'Our cancellation policy protects guides. Cancellations within 48 hours of the trip date result in a full payout to the guide. Earlier cancellations follow a tiered refund schedule.',
  },
  {
    q: 'Do I need to be affiliated with a club?',
    a: 'No. Guides are independent providers on AnglerPass. You request water access from clubs, but you\'re not bound to any single club.',
  },
  {
    q: 'How long does the verification process take?',
    a: 'Most guide profiles are reviewed within 48 hours of submitting all required documents. Make sure your guide license, insurance, and first aid certification are current and clearly readable to avoid delays.',
  },
  {
    q: 'Can I guide on multiple properties and for multiple clubs?',
    a: 'Yes. There is no limit to how many properties or clubs you can be approved for. Many guides build a network of approved waters across multiple regions to maximize their bookings.',
  },
  {
    q: 'What happens if a property or club removes my access?',
    a: 'If a club or landowner revokes your access, any future bookings on that water are canceled and the angler is notified. Existing completed trips and reviews remain on your profile.',
  },
  {
    q: 'Do anglers have to book a guide for their trip?',
    a: 'No. Guides are entirely optional on AnglerPass. Anglers can book water on their own or choose to add a guide during the booking process. Your profile is shown to anglers who are looking for guided experiences.',
  },
];

export default function GuidesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal pt-[160px] pb-[100px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(58,107,124,0.15),_transparent_60%)]" />
        <div className="relative max-w-[800px] mx-auto px-8 text-center">
          <span className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            For Guides
          </span>
          <h1 className="font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] text-parchment tracking-[-0.5px] mb-6">
            Your Skills. Their Water.<br />More Clients.
          </h1>
          <p className="text-[17px] leading-[1.7] text-parchment/60 max-w-[560px] mx-auto mb-10">
            AnglerPass connects professional guides with private water across the country.
            Get approved, set your rates, and let anglers book you directly when they
            reserve their trip. No cold calls, no middlemen.
          </p>
          <div className="flex gap-[14px] justify-center flex-wrap">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-[34px] py-4 rounded-md text-[14px] font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
            >
              Join the Waitlist &rarr;
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-[34px] py-4 rounded-md text-[14px] font-medium tracking-[0.3px] no-underline bg-transparent text-parchment border border-parchment/20 transition-all duration-[400ms]"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-[120px] bg-offwhite">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="reveal text-center mb-[72px]">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-charcoal">
              Guide Tools
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
              Everything you need to run your guiding business
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              Your dashboard, your schedule, your clients. AnglerPass handles the
              logistics so you can focus on putting people on fish.
            </p>
          </div>

          <div className="marketing-features-grid grid grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`reveal d${(i % 3) + 1} bg-white border border-parchment rounded-[14px] py-9 px-7 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]`}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-charcoal/8 flex items-center justify-center mb-5 text-charcoal">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-[20px] font-semibold text-forest mb-[10px] tracking-[-0.2px]">
                  {feature.title}
                </h3>
                <p className="text-[14.5px] leading-[1.7] text-text-secondary m-0">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="reveal text-center mb-16">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-charcoal">
              How It Works
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              From sign-up to first trip
            </h2>
          </div>

          <div className="grid">
            {howItWorks.map((item, i) => (
              <div
                key={item.step}
                className={`reveal d${(i % 3) + 1} grid grid-cols-[60px_1fr] gap-6 py-8 ${i < howItWorks.length - 1 ? 'border-b border-parchment' : ''}`}
              >
                <span className="font-mono text-[13px] text-charcoal font-semibold pt-1">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-heading text-[22px] font-semibold text-forest mb-2 tracking-[-0.2px]">
                    {item.title}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-text-secondary m-0">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-[100px] bg-offwhite">
        <div className="max-w-[800px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-charcoal">
              Requirements
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              What we look for
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
              We vet every guide on the platform. Landowners and clubs need to trust
              that anyone guiding on their water meets professional standards.
            </p>
          </div>

          <div className="reveal bg-white border border-parchment rounded-[14px] py-10 px-9 max-w-[500px] mx-auto">
            <ul className="list-none m-0 p-0">
              {requirements.map((req) => (
                <li
                  key={req}
                  className="flex items-center gap-3 py-3 text-[15px] text-text-primary border-b border-parchment"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[800px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-charcoal">
              Pricing
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              No subscription. No sign-up fees.
            </h2>
            <p className="text-[16px] text-text-secondary max-w-[560px] mx-auto leading-[1.65]">
              You set your rates. We add a 10% service fee on top, paid by the angler.
              You keep 100% of your stated rate on every trip.
            </p>
          </div>

          <div className="reveal bg-white border-2 border-charcoal rounded-[14px] py-12 px-10 max-w-[560px] mx-auto text-center">
            <h3 className="font-heading text-[28px] font-semibold text-forest mb-2">
              Free to join
            </h3>
            <p className="text-[15px] text-text-secondary leading-[1.65] mb-8">
              No monthly fee, no listing fee, no hidden costs.
            </p>

            <div className="marketing-features-grid grid grid-cols-2 gap-5 mb-8 text-left">
              <div className="bg-offwhite rounded-[10px] py-6 px-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-light mb-2">
                  Example
                </div>
                <div className="text-[14px] text-text-secondary leading-[1.7]">
                  <div className="flex justify-between py-1">
                    <span>Your rate</span>
                    <span className="font-semibold text-forest">$500</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="whitespace-nowrap">10% service fee<br /><span className="text-[11px] text-text-light">paid by the angler</span></span>
                    <span className="text-text-light">+$50</span>
                  </div>
                  <div className="flex justify-between pt-2 pb-1 border-t border-parchment mt-2">
                    <span className="font-semibold">You receive</span>
                    <span className="font-semibold text-forest">$500</span>
                  </div>
                </div>
              </div>
              <div className="bg-offwhite rounded-[10px] py-6 px-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-light mb-2">
                  What&apos;s included
                </div>
                <ul className="list-none m-0 p-0">
                  {['Profile & portfolio', 'Booking management', 'Calendar tools', 'Messaging', 'Review system', 'Stripe payouts'].map((item) => (
                    <li key={item} className="flex items-center gap-[6px] py-[3px] text-[13px] text-text-secondary">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-[14px] font-medium tracking-[0.3px] no-underline bg-charcoal text-white transition-all duration-[400ms]"
            >
              Join the Waitlist &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <DashboardPreviewSection role="guide" />

      {/* FAQ */}
      <section className="py-[100px] bg-parchment-light">
        <div className="max-w-[700px] mx-auto px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-charcoal">
              FAQ
            </span>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px]">
              Common questions
            </h2>
          </div>

          <AudienceFaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-[100px] bg-charcoal text-center">
        <div className="reveal max-w-[600px] mx-auto px-8">
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] text-parchment mb-4 tracking-[-0.3px]">
            Ready to expand your range?
          </h2>
          <p className="text-[16px] leading-[1.7] text-parchment/55 max-w-[480px] mx-auto mb-10">
            Join a growing network of professional guides accessing private water
            across the country. Your next client is already looking.
          </p>
          <Link
            href="/#waitlist"
            className="inline-flex items-center gap-2 px-10 py-[18px] rounded-md text-[15px] font-medium tracking-[0.3px] no-underline bg-bronze text-white transition-all duration-[400ms]"
          >
            Join the Waitlist &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
