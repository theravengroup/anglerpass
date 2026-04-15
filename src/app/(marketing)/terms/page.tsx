import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — AnglerPass',
  description:
    'Terms of Service for AnglerPass: accounts, guide verification, payments, payouts, cancellations, liability, and governing law.',
  openGraph: {
    title: 'Terms of Service — AnglerPass',
    description:
      'Terms of Service for the AnglerPass platform.',
  },
};

const sectionClass = 'mb-12 scroll-mt-28';
const headingClass = 'font-heading text-[clamp(20px,2.5vw,24px)] font-semibold leading-[1.2] text-forest mb-4 tracking-[-0.2px]';
const textClass = 'text-[14.5px] leading-[1.8] text-text-secondary mb-3';
const listClass = `${textClass} ap-list`;
const listItemClass = 'mb-2.5';

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(154,115,64,0.1),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[800px] px-8 text-center">
          <span className="mb-5 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Legal
          </span>
          <h1 className="mb-6 font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] tracking-[-0.5px] text-parchment">
            Terms of Service
          </h1>
          <p className="mx-auto max-w-[560px] text-[17px] leading-[1.7] text-parchment/60">
            By creating an account or using AnglerPass, you agree to
            the following terms. Last updated April 2026.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-offwhite py-16 lg:py-20">
        <div className="mx-auto max-w-[760px] px-8">

          {/* 1. Overview */}
          <div className={sectionClass}>
            <h2 className={headingClass}>1. Overview</h2>
            <p className={textClass}>
              AnglerPass is a platform operated by Angler Pass, LLC that
              connects private water landowners, fishing clubs, professional
              guides, and anglers. We provide tools for managing property access,
              club memberships, guide verification, bookings, and payments on
              private fly fishing waters.
            </p>
          </div>

          {/* 2. Accounts */}
          <div className={sectionClass}>
            <h2 className={headingClass}>2. Accounts &amp; eligibility</h2>
            <p className={textClass}>
              You must be at least 18 years old to create an account. You are
              responsible for maintaining the security of your login credentials
              and for all activity under your account. You must provide accurate,
              current information when creating an account and keep your profile
              information up to date. Each person may maintain only one account.
            </p>
          </div>

          {/* 3. User roles */}
          <div className={sectionClass}>
            <h2 className={headingClass}>3. User roles</h2>
            <p className={textClass}>
              AnglerPass supports four primary roles:{' '}
              <strong>landowners</strong> who list properties,{' '}
              <strong>clubs</strong> that manage memberships and property access,{' '}
              <strong>anglers</strong> who book fishing days, and{' '}
              <strong>guides</strong> who offer professional guiding services.
              Users may hold multiple roles. Each role has specific
              responsibilities outlined in these terms.
            </p>
          </div>

          {/* 4. Guide verification */}
          <div className={sectionClass}>
            <h2 className={headingClass}>4. Guide verification</h2>
            <p className={textClass}>
              Guides must complete a mandatory verification process before their
              profile becomes visible to anglers. Verification includes: (a)
              completing a guide profile with required credentials, (b) paying a
              one-time $49 verification fee, (c) passing a background check
              conducted by Checkr, and (d) receiving final approval from
              AnglerPass administrators. The verification fee is non-refundable,
              including if the background check returns an unfavorable result or
              if the application is rejected.
            </p>
            <p className={textClass}>
              Verified guides must maintain valid credentials at all times.
              Required credentials include a state guide license and liability
              insurance; first aid certification, USCG license, and other
              credentials may be required based on services offered. AnglerPass
              monitors credential expiration dates and will send reminders at 60,
              30, and 7 days before expiry. If a credential expires, the
              guide&rsquo;s profile will be automatically suspended until renewed
              documentation is uploaded. Guides are solely responsible for
              maintaining current credentials and legal compliance in their
              operating jurisdictions.
            </p>
          </div>

          {/* 5. Content & listings */}
          <div className={sectionClass}>
            <h2 className={headingClass}>5. Content &amp; listings</h2>
            <p className={textClass}>
              Property owners and clubs are responsible for the accuracy of their
              listings, including descriptions, photos, availability, water
              conditions, and pricing. Guides are responsible for the accuracy of
              their profile information, qualifications, and rates. AnglerPass
              acts as a platform and does not guarantee the quality, safety, or
              legality of any listed property, fishing experience, or guide
              service.
            </p>
            <p className={textClass}>
              Uploaded photos are automatically processed (resized, converted to
              WebP format) for platform performance. By uploading content, you
              confirm you have the right to use it and grant AnglerPass a
              non-exclusive license to display it on the platform.
            </p>
          </div>

          {/* 6. Club memberships */}
          <div className={sectionClass}>
            <h2 className={headingClass}>6. Club memberships</h2>
            <p className={textClass}>
              Club membership terms, including initiation fees, annual dues, and
              rules, are set by each club. Membership applications are reviewed
              and approved or declined at the club&rsquo;s discretion. Dues
              auto-renew annually via the payment method on file. A 7-day grace
              period applies to failed renewal payments. Full membership policies,
              including cancellation terms, are available on our{' '}
              <a href="/policies" className="text-river underline">
                Policies
              </a>{' '}
              page. Corporate memberships, where enabled by a club, allow
              employers to sponsor memberships for their employees.
            </p>
          </div>

          {/* 7. Cross-Club Network */}
          <div className={sectionClass}>
            <h2 className={headingClass}>7. Cross-Club Network</h2>
            <p className={textClass}>
              Clubs may opt in to cross-club access agreements, allowing members
              of one club to book fishing days on water managed by participating
              partner clubs. Cross-club access is subject to availability, rod
              fees, and each club&rsquo;s participation terms.
            </p>
          </div>

          {/* 8. Payments & fees */}
          <div className={sectionClass}>
            <h2 className={headingClass}>8. Payments &amp; fees</h2>
            <p className={textClass}>
              All payment processing is handled through Stripe. Fees vary by
              transaction type as described below. For current amounts and
              examples, see our{' '}
              <a href="/pricing" className="text-river underline">
                Pricing
              </a>{' '}
              page.
            </p>

            <p className={textClass}>
              <strong>Club membership payments.</strong>{' '}Clubs set their own
              initiation fees and annual dues. A 5% AnglerPass platform fee
              is added at checkout and paid by the member. Clubs receive 100%
              of their stated fees.
            </p>

            <p className={textClass}>
              <strong>Club subscriptions.</strong>{' '}Clubs pay a monthly
              subscription based on their tier. Early Access pricing
              (Starter $79/mo, Standard $199/mo, Pro $499/mo) is available
              through September&nbsp;30,&nbsp;2026. Subscription tiers determine
              member limits, property limits, and access to features such as
              cross-club agreements and corporate memberships.
            </p>

            <p className={textClass}>
              <strong>Property bookings &mdash; rod fee split.</strong>{' '}Anglers
              pay the landowner&rsquo;s rod fee plus a 15% platform fee on each
              booking. The rod fee is split between the managing club and the
              landowner per the property&rsquo;s classification: Select
              (50% club / 50% landowner), Premier (35% / 65%), or Signature
              (25% / 75%). The 15% platform fee is paid by the angler and does
              not reduce the landowner&rsquo;s or club&rsquo;s payout.
            </p>

            <p className={textClass}>
              <strong>Property bookings &mdash; upfront lease.</strong>{' '}A
              landowner may alternatively opt for an upfront annual lease. In
              this model the landowner receives 100% of the agreed lease
              amount via ACH at lease acceptance. AnglerPass charges a 5%
              facilitation fee on top of that amount to the managing club, so
              the club&rsquo;s total ACH charge equals the landowner&rsquo;s
              agreed amount plus 5%. For bookings on lease properties, the
              managing club keeps 100% of the rod fee; the landowner receives
              no per-booking payout since they were paid upfront.
            </p>

            <p className={textClass}>
              <strong>Cross-club access.</strong>{' '}When an angler books water
              managed by a club other than their home club, a $25 per rod per
              day cross-club access fee applies. Of this fee, $15 goes to
              AnglerPass and $10 goes to the angler&rsquo;s home club as a
              referral. The hosting (managing) club still receives its full
              rod-fee share per the property&rsquo;s classification.
            </p>

            <p className={textClass}>
              <strong>Staff discount.</strong>{' '}Staff of the managing club
              booking at their own club&rsquo;s properties receive the
              club&rsquo;s share of the rod fee as a discount (absorbed by the
              club). The landowner still receives their full classification
              share of the gross rod fee. Cross-club bookings by staff do not
              receive this discount and all cross-club fees still apply.
            </p>

            <p className={textClass}>
              <strong>Guide services.</strong>{' '}Guide rates are set by the
              guide. When an angler adds a guide to their booking, a 10%
              service fee is added to the angler&rsquo;s checkout total.
              Guides receive 100% of their stated rate &mdash; the service
              fee is never deducted from the guide&rsquo;s payout.
            </p>

            <p className={textClass}>
              <strong>Guide verification.</strong>{' '}Guides pay a one-time $49
              verification fee to complete the mandatory background check and
              profile review process. This fee is non-refundable, including
              if the background check returns an unfavorable result or the
              application is rejected.
            </p>
          </div>

          {/* 9. Payouts */}
          <div className={sectionClass}>
            <h2 className={headingClass}>9. Payouts</h2>
            <p className={textClass}>
              Payouts are processed through Stripe Connect. All booking-related
              payouts are subject to a 7-day hold after the trip date for dispute
              resolution. Payout schedules vary by role:
            </p>
            <ul className={listClass}>
              <li className={listItemClass}>
                <strong>Guides:</strong>{' '}
                24&ndash;48 hours after the 7-day hold clears
              </li>
              <li className={listItemClass}>
                <strong>Landowners:</strong>{' '}Weekly, processed every Monday
              </li>
              <li className={listItemClass}>
                <strong>Clubs:</strong>{' '}Monthly, processed on the 1st of each
                month
              </li>
            </ul>
            <p className={textClass}>
              All payout recipients must complete Stripe Connect onboarding,
              including identity verification and bank account setup, before
              receiving payouts. Full payout details are available on our{' '}
              <a href="/policies#payouts" className="text-river underline">
                Policies
              </a>{' '}
              page.
            </p>
          </div>

          {/* 10. Booking cancellations */}
          <div className={sectionClass}>
            <h2 className={headingClass}>
              10. Booking cancellations &amp; refunds
            </h2>
            <p className={textClass}>
              Booking cancellation and refund policies are detailed on our{' '}
              <a href="/policies#bookings" className="text-river underline">
                Policies
              </a>{' '}
              page. In general, cancellations made more than 7 days before the
              trip date receive a full refund. Cancellations 3&ndash;7 days before
              receive a 75% refund, and cancellations 24 hours to 3 days before
              receive a 50% refund. Cancellations less than 24 hours before the
              trip receive no refund. A $15 late cancellation processing fee
              applies to all cancellations within 72 hours of the trip date.
              AnglerPass reserves the right to mediate disputes between parties.
            </p>
          </div>

          {/* 11. Reviews */}
          <div className={sectionClass}>
            <h2 className={headingClass}>11. Reviews</h2>
            <p className={textClass}>
              After a completed trip, anglers may submit reviews of properties and
              guides. Reviews are subject to a moderation period before
              publication. Our{' '}
              <a
                href="/policies#review-moderation"
                className="text-river underline"
              >
                Review Moderation Policy
              </a>{' '}
              details what content is and is not permitted, the moderation
              process, and how to flag inappropriate reviews.
            </p>
          </div>

          {/* 12. Acceptable use */}
          <div className={sectionClass}>
            <h2 className={headingClass}>12. Acceptable use</h2>
            <p className={textClass}>
              You agree to use AnglerPass only for its intended purpose. You may
              not: misrepresent property access or guide qualifications; create
              fraudulent listings or bookings; harass, discriminate against, or
              threaten other users; circumvent the platform to arrange
              off-platform payments; upload malicious content; or violate any
              applicable laws or regulations.
            </p>
          </div>

          {/* 13. Suspension & termination */}
          <div className={sectionClass}>
            <h2 className={headingClass}>13. Suspension &amp; termination</h2>
            <p className={textClass}>
              We reserve the right to suspend or terminate accounts that violate
              these terms. Guide profiles may be suspended automatically for
              expired credentials or by administrators for policy violations.
              Suspended guides cannot accept new bookings; existing bookings for
              suspended guides will be cancelled with full refunds to anglers. You
              may delete your account at any time by contacting us at{' '}
              <a
                href="mailto:support@anglerpass.com"
                className="text-river underline"
              >
                support@anglerpass.com
              </a>
              .
            </p>
          </div>

          {/* 14. Assumption of risk */}
          <div className={sectionClass}>
            <h2 className={headingClass}>14. Assumption of risk</h2>
            <p className={textClass}>
              Fly fishing and outdoor activities carry inherent risks including
              but not limited to injury, property damage, and exposure to weather
              and wildlife. By using AnglerPass to book fishing experiences, you
              acknowledge and accept these risks. AnglerPass is not a guide
              service, outfitter, or property operator &mdash; we are a technology
              platform that connects parties.
            </p>
          </div>

          {/* 15. Limitation of liability */}
          <div className={sectionClass}>
            <h2 className={headingClass}>15. Limitation of liability</h2>
            <p className={textClass}>
              AnglerPass is provided &ldquo;as is&rdquo; without warranties of
              any kind, express or implied. To the maximum extent permitted by
              law, Angler Pass, LLC is not liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of
              the platform, interactions with other users, or experiences on
              listed properties. Our total liability for any claim shall not
              exceed the amount you paid to AnglerPass in the 12 months preceding
              the claim.
            </p>
          </div>

          {/* 16. Intellectual property */}
          <div className={sectionClass}>
            <h2 className={headingClass}>16. Intellectual property</h2>
            <p className={textClass}>
              All AnglerPass branding, design, and platform code are the property
              of Angler Pass, LLC. User-submitted content (property
              descriptions, photos, reviews, profile information) remains the
              property of the submitter, with a non-exclusive, worldwide license
              granted to AnglerPass to display, reproduce, and process it on the
              platform (including image resizing and format conversion).
            </p>
          </div>

          {/* 17. Governing law */}
          <div className={sectionClass}>
            <h2 className={headingClass}>17. Governing law</h2>
            <p className={textClass}>
              These terms are governed by the laws of the State of Virginia,
              without regard to conflict of law provisions. Any disputes shall be
              resolved in the courts of Virginia.
            </p>
          </div>

          {/* 18. Changes */}
          <div className={sectionClass}>
            <h2 className={headingClass}>18. Changes to these terms</h2>
            <p className={textClass}>
              We may update these terms as the platform evolves. Material changes
              will be communicated to registered users by email at least 30 days
              before taking effect. Continued use of the platform after the
              effective date constitutes acceptance of the updated terms. If you
              do not agree with the changes, you may close your account before
              the effective date.
            </p>
          </div>

          {/* Footer links */}
          <div className="border-t border-parchment pt-8">
            <p className="text-[14px] text-text-light">
              See also our{' '}
              <a href="/privacy" className="text-river underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/policies" className="text-river underline">
                Platform Policies
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
